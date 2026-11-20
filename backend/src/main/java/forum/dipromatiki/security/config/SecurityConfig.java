package forum.dipromatiki.security.config;

import forum.dipromatiki.security.JwtAuthenticationFilter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Every role except OBSERVER gets calendar, tasks and the member list.
    private static final String[] MEMBER_ROLES = {
            "ADMIN", "BOARD", "COORDINATOR", "PR_TEAM", "DESIGN_TEAM", "FR_TEAM", "FULL_MEMBER", "BABY_MEMBER"
    };

    @Value("${dipromatiki.security.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${dipromatiki.security.cors.allowed-methods}")
    private String allowedMethods;

    @Value("${dipromatiki.security.cors.allowed-headers}")
    private String allowedHeaders;

    @Value("${dipromatiki.security.cors.allow-credentials}")
    private boolean allowCredentials;

    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationProvider authenticationProvider
    ) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(c -> c.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(e -> e.authenticationEntryPoint(
                        (req, res, ex) -> res.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED)
                ))
                .authorizeHttpRequests(request -> request
                        .requestMatchers("/auth/**").permitAll()
                        // Without this, any 404/405/500 is re-dispatched to /error and shows up as a 401.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/categories/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/categories/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/members/*/roles").hasAnyRole("BOARD", "ADMIN")
                        .requestMatchers("/members").hasAnyRole(MEMBER_ROLES)
                        .requestMatchers(HttpMethod.GET, "/calendar/**").hasAnyRole(MEMBER_ROLES)
                        .requestMatchers("/calendar/**").hasAnyRole("BOARD", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/tasks").hasAnyRole("BOARD", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/tasks/*").hasAnyRole("BOARD", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/tasks/*").hasAnyRole("BOARD", "ADMIN")
                        .requestMatchers("/tasks/**").hasAnyRole(MEMBER_ROLES)
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of(allowedMethods.split(",")));
        configuration.setAllowedHeaders(List.of(allowedHeaders.split(",")));
        configuration.setAllowCredentials(allowCredentials);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}