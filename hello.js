import org.springframework.http.server.reactive.ReactorHttpHandlerAdapter;
import org.springframework.web.server.adapter.WebHttpHandlerBuilder;
import reactor.core.scheduler.Scheduler;
import reactor.netty.http.server.HttpServer;

public class CustomSchedulerReactorHttpHandlerAdapter extends ReactorHttpHandlerAdapter {

    private final Scheduler customScheduler;

    public CustomSchedulerReactorHttpHandlerAdapter(WebHttpHandlerBuilder.HttpHandler httpHandler, Scheduler customScheduler) {
        super(httpHandler);
        this.customScheduler = customScheduler;
    }

    @Override
    public HttpServer apply(HttpServer httpServer) {
        return httpServer.runOn(customScheduler);
    }
}

import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServer;
import org.springframework.http.server.reactive.HttpHandler;
import org.springframework.web.server.adapter.WebHttpHandlerBuilder;
import reactor.core.scheduler.Scheduler;

public class CustomSchedulerNettyReactiveWebServerFactory extends NettyReactiveWebServerFactory {

    private final Scheduler customScheduler;

    public CustomSchedulerNettyReactiveWebServerFactory(Scheduler customScheduler) {
        this.customScheduler = customScheduler;
    }

    @Override
    public WebServer getWebServer(HttpHandler httpHandler) {
        WebHttpHandlerBuilder.HttpHandler decorated = WebHttpHandlerBuilder.applicationContext(getApplicationContext())
                .httpHandler(httpHandler)
                .build();

        CustomSchedulerReactorHttpHandlerAdapter adapter = new CustomSchedulerReactorHttpHandlerAdapter(decorated, customScheduler);

        return super.getWebServer(adapter);
    }
}

import org.springframework.boot.actuate.autoconfigure.web.server.ManagementServerProperties;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.reactive.server.ReactiveWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;

@Configuration
public class ActuatorServerConfig {

    @Bean
    public ReactiveWebServerFactory actuatorServerFactory(
            Scheduler customActuatorScheduler,
            ServerProperties serverProperties,
            ManagementServerProperties managementServerProperties) {
        
        NettyReactiveWebServerFactory factory = new CustomSchedulerNettyReactiveWebServerFactory(customActuatorScheduler);
        
        Integer port = managementServerProperties.getPort() != null 
            ? managementServerProperties.getPort() 
            : serverProperties.getPort();
        
        factory.setPort(port != null ? port : 8080);
        return factory;
    }
}



