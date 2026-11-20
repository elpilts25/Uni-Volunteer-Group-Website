package forum.dipromatiki.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class ForumControllerTests {

    @Autowired private WebApplicationContext context;
    @Autowired @Qualifier("springSecurityFilterChain") private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();
    }

    private long createCategory(String name) throws Exception {
        String body = mockMvc().perform(post("/categories")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"d\",\"icon\":\"chat\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonMapper.builder().build().readTree(body).get("id").asLong();
    }

    @Test
    void categoriesRequireAuthentication() throws Exception {
        mockMvc().perform(get("/categories")).andExpect(status().isUnauthorized());
    }

    @Test
    void regularUserCannotCreateCategory() throws Exception {
        mockMvc().perform(post("/categories")
                        .with(user("alice").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicateCategoryNameIsRejected() throws Exception {
        createCategory("Duplicates");
        mockMvc().perform(post("/categories")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"duplicates\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void topicAndReplyFlow() throws Exception {
        long categoryId = createCategory("General");

        String topicBody = mockMvc().perform(post("/categories/" + categoryId + "/topics")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hello\",\"content\":\"First post\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author").value("admin"))
                .andReturn().getResponse().getContentAsString();
        long topicId = JsonMapper.builder().build().readTree(topicBody).get("id").asLong();

        mockMvc().perform(post("/topics/" + topicId + "/posts")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"A reply\"}"))
                .andExpect(status().isCreated());

        mockMvc().perform(get("/topics/" + topicId).with(user("alice").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Hello"))
                .andExpect(jsonPath("$.posts.length()").value(1));

        mockMvc().perform(get("/categories").with(user("alice").roles("USER")))
                .andExpect(status().isOk());
    }

    @Test
    void onlyAuthorOrAdminCanEditAndDeleteTopics() throws Exception {
        long categoryId = createCategory("Editable");
        String topicBody = mockMvc().perform(post("/categories/" + categoryId + "/topics")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Old\",\"content\":\"Old text\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long topicId = JsonMapper.builder().build().readTree(topicBody).get("id").asLong();
        String update = "{\"title\":\"New\",\"content\":\"New text\"}";

        mockMvc().perform(put("/topics/" + topicId)
                        .with(user("alice").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isForbidden());
        mockMvc().perform(delete("/topics/" + topicId).with(user("alice").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc().perform(put("/topics/" + topicId)
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New"));

        mockMvc().perform(delete("/topics/" + topicId).with(user("admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
        mockMvc().perform(get("/topics/" + topicId).with(user("alice").roles("USER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void membersListIsRestrictedAndHasActivityCounts() throws Exception {
        mockMvc().perform(get("/members").with(user("alice").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc().perform(get("/members").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.username=='admin')].roles[0]").value("ADMIN"))
                .andExpect(jsonPath("$[0].topicCount").isNumber())
                .andExpect(jsonPath("$[0].replyCount").isNumber())
                .andExpect(jsonPath("$[0].email").doesNotExist());
    }

    @Test
    void unreadMessagesAreTrackedPerUser() throws Exception {
        mockMvc().perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"readerone\",\"fullName\":\"R One\",\"email\":\"readerone@example.com\","
                                + "\"department\":\"X\",\"phone\":\"6912345678\",\"birthDate\":\"2000-01-31\","
                                + "\"password\":\"pw12345\"}"))
                .andExpect(status().isOk());
        long categoryId = createCategory("Unread");
        String topicBody = mockMvc().perform(post("/categories/" + categoryId + "/topics")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"News\",\"content\":\"Fresh\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long topicId = JsonMapper.builder().build().readTree(topicBody).get("id").asLong();
        String topicsUrl = "/categories/" + categoryId + "/topics";

        mockMvc().perform(get(topicsUrl).with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$[0].unread").value(1));
        mockMvc().perform(get(topicsUrl).with(user("admin").roles("ADMIN")))
                .andExpect(jsonPath("$[0].unread").value(0));
        mockMvc().perform(get("/categories").with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$[?(@.id==" + categoryId + ")].unreadCount").value(1));
        mockMvc().perform(get("/stats").with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$.newMessages").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        mockMvc().perform(post("/topics/" + topicId + "/read").with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(status().isNoContent());
        mockMvc().perform(get(topicsUrl).with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$[0].unread").value(0));

        mockMvc().perform(post("/topics/" + topicId + "/posts")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Update\"}"))
                .andExpect(status().isCreated());
        mockMvc().perform(get(topicsUrl).with(user("readerone").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$[0].unread").value(1));
    }

    @Test
    void deletingCategoryRemovesItsTopics() throws Exception {
        long categoryId = createCategory("Temporary");
        mockMvc().perform(post("/categories/" + categoryId + "/topics")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"T\",\"content\":\"C\"}"))
                .andExpect(status().isCreated());

        mockMvc().perform(delete("/categories/" + categoryId).with(user("admin").roles("ADMIN")))
                .andExpect(status().isNoContent());

        mockMvc().perform(get("/categories/" + categoryId + "/topics").with(user("alice").roles("USER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void restrictedCategoryIsOnlyVisibleToItsRoles() throws Exception {
        String body = mockMvc().perform(post("/categories")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Board only\",\"allowedRoles\":[\"BOARD\"]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.allowedRoles[0]").value("BOARD"))
                .andReturn().getResponse().getContentAsString();
        long categoryId = JsonMapper.builder().build().readTree(body).get("id").asLong();

        mockMvc().perform(get("/categories").with(user("bob").roles("BOARD")))
                .andExpect(jsonPath("$[?(@.id==" + categoryId + ")]").isNotEmpty());
        mockMvc().perform(get("/categories").with(user("admin").roles("ADMIN")))
                .andExpect(jsonPath("$[?(@.id==" + categoryId + ")]").isNotEmpty());
        mockMvc().perform(get("/categories").with(user("carol").roles("FULL_MEMBER")))
                .andExpect(jsonPath("$[?(@.id==" + categoryId + ")]").isEmpty());

        mockMvc().perform(get("/categories/" + categoryId + "/topics").with(user("carol").roles("FULL_MEMBER")))
                .andExpect(status().isForbidden());
        mockMvc().perform(post("/categories/" + categoryId + "/topics")
                        .with(user("carol").roles("FULL_MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"T\",\"content\":\"C\"}"))
                .andExpect(status().isForbidden());
        mockMvc().perform(get("/categories/" + categoryId + "/topics").with(user("bob").roles("BOARD")))
                .andExpect(status().isOk());
    }
}
