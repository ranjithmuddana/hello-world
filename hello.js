import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.config.environment.Environment;
import org.springframework.cloud.config.environment.PropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
public class JdbcCustomEnvironmentRepository implements CustomEnvironmentRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcCustomEnvironmentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Environment findOne(String application, String profile, String label) {
        String sql = "SELECT KEY, VALUE FROM PROPERTIES WHERE APPLICATION=? AND PROFILE=? AND LABEL=?";
        Map<String, Object> properties = new HashMap<>();

        jdbcTemplate.query(sql, new Object[]{application, profile, label}, rs -> {
            properties.put(rs.getString("KEY"), rs.getObject("VALUE"));
        });

        PropertySource propertySource = new PropertySource("databaseProperties", properties);
        Environment environment = new Environment(application, profile, label);
        environment.add(propertySource);

        return environment;
    }
}