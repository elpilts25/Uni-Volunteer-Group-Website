package forum.dipromatiki.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class TaskControllerTests {

    private static final String TASK =
            "{\"team\":\"DESIGN\",\"title\":\"Create posters\",\"description\":\"For the campaign\","
                    + "\"priority\":\"HIGH\",\"dueDate\":\"2026-06-08\",\"criteria\":[\"Draft approved\",\"Printed\"]}";

    @Autowired private WebApplicationContext context;
    @Autowired @Qualifier("springSecurityFilterChain") private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();
    }

    // "admin" exists in the DB (seeded), so lookups by username succeed with any granted role.
    private long createTask() throws Exception {
        String body = mockMvc().perform(post("/tasks")
                        .with(user("admin").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON).content(TASK))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.criteria.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        return JsonMapper.builder().build().readTree(body).get("id").asLong();
    }

    @Test
    void plainUserCannotViewTasks() throws Exception {
        mockMvc().perform(get("/tasks").with(user("alice").roles("USER"))).andExpect(status().isForbidden());
        mockMvc().perform(get("/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void memberCanViewButNotManage() throws Exception {
        long id = createTask();
        mockMvc().perform(get("/tasks").with(user("alice").roles("FULL_MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].criteriaTotal").value(2));
        mockMvc().perform(post("/tasks").with(user("alice").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content(TASK))
                .andExpect(status().isForbidden());
        mockMvc().perform(put("/tasks/" + id).with(user("alice").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content(TASK))
                .andExpect(status().isForbidden());
        mockMvc().perform(delete("/tasks/" + id).with(user("alice").roles("FULL_MEMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void memberCanClaimMoveCheckAndComment() throws Exception {
        long id = createTask();

        mockMvc().perform(post("/tasks/" + id + "/claim").with(user("admin").roles("FULL_MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOING"))
                .andExpect(jsonPath("$.assignees[0].username").value("admin"));

        mockMvc().perform(patch("/tasks/" + id + "/status").with(user("admin").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"FEEDBACK\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FEEDBACK"));

        mockMvc().perform(patch("/tasks/" + id + "/criteria/0").with(user("admin").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.criteria[0].done").value(true));

        mockMvc().perform(patch("/tasks/" + id + "/criteria/9").with(user("admin").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isNotFound());

        mockMvc().perform(post("/tasks/" + id + "/comments").with(user("admin").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Looks good\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comments.length()").value(1));

        mockMvc().perform(delete("/tasks/" + id + "/claim").with(user("admin").roles("FULL_MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignees.length()").value(0));
    }

    @Test
    void updateKeepsCheckedCriteriaAndDeleteRemovesTask() throws Exception {
        long id = createTask();
        mockMvc().perform(patch("/tasks/" + id + "/criteria/1").with(user("admin").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isOk());

        mockMvc().perform(put("/tasks/" + id).with(user("admin").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"team\":\"PR\",\"title\":\"Renamed\",\"priority\":\"LOW\","
                                + "\"criteria\":[\"Printed\",\"Shared\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.team").value("PR"))
                .andExpect(jsonPath("$.criteria[0].done").value(true))
                .andExpect(jsonPath("$.criteria[1].done").value(false));

        mockMvc().perform(delete("/tasks/" + id).with(user("admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
        mockMvc().perform(get("/tasks/" + id).with(user("alice").roles("FULL_MEMBER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidTaskIsRejected() throws Exception {
        mockMvc().perform(post("/tasks").with(user("admin").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"team\":\"DESIGN\",\"title\":\" \",\"priority\":\"LOW\"}"))
                .andExpect(status().isBadRequest());
        mockMvc().perform(post("/tasks").with(user("admin").roles("BOARD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"team\":\"NOPE\",\"title\":\"x\",\"priority\":\"LOW\"}"))
                .andExpect(status().isBadRequest());
    }
}
