package forum.dipromatiki.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class CalendarControllerTests {

    private static final String EVENT =
            "{\"title\":\"Weekly\",\"type\":\"MEETING\",\"date\":\"2026-09-07\",\"time\":\"18:00\",\"location\":\"Room 1\"}";
    private static final String RANGE = "?from=2026-08-31&to=2026-10-04";

    @Autowired private WebApplicationContext context;
    @Autowired @Qualifier("springSecurityFilterChain") private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();
    }

    // "admin" exists in the DB (seeded), so the creator lookup succeeds with any granted role.
    private long scheduleAs(String role) throws Exception {
        String body = mockMvc().perform(post("/calendar/events")
                        .with(user("admin").roles(role))
                        .contentType(MediaType.APPLICATION_JSON).content(EVENT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdBy").value("admin"))
                .andReturn().getResponse().getContentAsString();
        return JsonMapper.builder().build().readTree(body).get("id").asLong();
    }

    @Test
    void plainUserCannotViewCalendar() throws Exception {
        mockMvc().perform(get("/calendar/events" + RANGE).with(user("alice").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousIsUnauthorized() throws Exception {
        mockMvc().perform(get("/calendar/events" + RANGE)).andExpect(status().isUnauthorized());
    }

    @Test
    void memberCanViewButNotSchedule() throws Exception {
        mockMvc().perform(get("/calendar/events" + RANGE).with(user("alice").roles("FULL_MEMBER")))
                .andExpect(status().isOk());
        mockMvc().perform(post("/calendar/events")
                        .with(user("alice").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content(EVENT))
                .andExpect(status().isForbidden());
    }

    @Test
    void boardCanScheduleAndMembersSeeIt() throws Exception {
        scheduleAs("BOARD");
        mockMvc().perform(get("/calendar/events" + RANGE).with(user("alice").roles("FULL_MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title=='Weekly')].time").value("18:00:00"));
    }

    @Test
    void deleteAllowedForCreatorAndAdminOnly() throws Exception {
        long id = scheduleAs("BOARD");
        mockMvc().perform(delete("/calendar/events/" + id).with(user("other").roles("BOARD")))
                .andExpect(status().isForbidden());
        mockMvc().perform(delete("/calendar/events/" + id).with(user("admin").roles("BOARD")))
                .andExpect(status().isNoContent());

        long second = scheduleAs("BOARD");
        mockMvc().perform(delete("/calendar/events/" + second).with(user("someone").roles("ADMIN")))
                .andExpect(status().isNoContent());
    }

    @Test
    void invalidEventAndRangeAreRejected() throws Exception {
        mockMvc().perform(post("/calendar/events")
                        .with(user("admin").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\",\"type\":\"PARTY\",\"date\":\"2026-09-07\",\"time\":\"18:00\"}"))
                .andExpect(status().isBadRequest());
        mockMvc().perform(get("/calendar/events?from=2026-01-01&to=2026-12-31").with(user("a").roles("FULL_MEMBER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminCanChangeRolesButNotOwn() throws Exception {
        mockMvc().perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"roleuser\",\"fullName\":\"R U\",\"email\":\"roleuser@example.com\","
                                + "\"department\":\"X\",\"phone\":\"6912345678\",\"birthDate\":\"2000-01-31\","
                                + "\"password\":\"pw12345\"}"))
                .andExpect(status().isOk());

        String users = mockMvc().perform(get("/admin/users").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long roleUserId = 0;
        long adminId = 0;
        for (JsonNode node : JsonMapper.builder().build().readTree(users)) {
            if (node.get("username").asText().equals("roleuser")) roleUserId = node.get("id").asLong();
            if (node.get("username").asText().equals("admin")) adminId = node.get("id").asLong();
        }

        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"FULL_MEMBER\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("FULL_MEMBER"));

        // A member can hold several roles; they come back in canonical order.
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("coach").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"FULL_MEMBER\",\"PR_TEAM\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles.length()").value(2))
                .andExpect(jsonPath("$.roles[0]").value("PR_TEAM"))
                .andExpect(jsonPath("$.roles[1]").value("FULL_MEMBER"));

        // You can edit your own roles, but the last Admin cannot be removed.
        mockMvc().perform(put("/members/" + adminId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"ADMIN\",\"BOARD\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles.length()").value(2));

        mockMvc().perform(put("/members/" + adminId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"BOARD\"]}"))
                .andExpect(status().isBadRequest());

        // With a second admin in place, an admin can be demoted again.
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"ADMIN\"]}"))
                .andExpect(status().isOk());
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"FULL_MEMBER\"]}"))
                .andExpect(status().isOk());

        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"ROOT\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[]}"))
                .andExpect(status().isBadRequest());

        // Board members cannot grant or touch the Admin role.
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("alice").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"ADMIN\"]}"))
                .andExpect(status().isForbidden());
        mockMvc().perform(put("/members/" + adminId + "/roles")
                        .with(user("alice").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"OBSERVER\"]}"))
                .andExpect(status().isForbidden());

        // Other roles cannot edit roles at all.
        mockMvc().perform(put("/members/" + roleUserId + "/roles")
                        .with(user("alice").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"OBSERVER\"]}"))
                .andExpect(status().isForbidden());
    }
}
