package forum.dipromatiki.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.beans.factory.annotation.Qualifier;

@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigTests {

    @Autowired private WebApplicationContext context;
    @Autowired private forum.dipromatiki.service.JwtService jwtService;
    @Autowired @Qualifier("springSecurityFilterChain") private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();
    }

    @Test
    void malformedTokenIsRejected() throws Exception {
        mockMvc().perform(get("/me").header("Authorization", "Bearer not.a.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validTokenOfUnknownUserIsRejected() throws Exception {
        String token = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User("ghost", "x", java.util.List.of()));
        mockMvc().perform(get("/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc().perform(get("/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedRequestIsAccepted() throws Exception {
        mockMvc().perform(get("/me").with(user("alice").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void adminEndpointForbiddenForUser() throws Exception {
        mockMvc().perform(get("/admin/ping").with(user("alice").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpointAllowedForAdmin() throws Exception {
        mockMvc().perform(get("/admin/ping").with(user("root").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void registerThenLoginReturnsJwtAndProtectedEndpointWorks() throws Exception {
        String registerBody = "{\"username\":\"bob\",\"fullName\":\"Bob Smith\",\"email\":\"bob@example.com\","
                + "\"department\":\"Informatics\",\"phone\":\"6912345678\",\"birthDate\":\"2000-01-31\","
                + "\"password\":\"pw12345\"}";

        mockMvc().perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(registerBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        MvcResult login = mockMvc().perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"BOB@example.com\",\"password\":\"pw12345\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        String token = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(login.getResponse().getContentAsString()).get("token").asText();

        mockMvc().perform(get("/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"));
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() throws Exception {
        mockMvc().perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerWithInvalidEmailIsRejected() throws Exception {
        String body = "{\"username\":\"carl\",\"fullName\":\"Carl\",\"email\":\"not-an-email\","
                + "\"department\":\"Informatics\",\"phone\":\"6912345678\",\"birthDate\":\"2000-01-31\","
                + "\"password\":\"pw12345\"}";

        mockMvc().perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }
}

