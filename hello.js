import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {
    @Bean
    public FilterRegistrationBean<ESAPIEncodingFilter> esapiFilter() {
        FilterRegistrationBean<ESAPIEncodingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new ESAPIEncodingFilter());
        registrationBean.addUrlPatterns("/*"); // Apply the filter to all requests
        return registrationBean;
    }
}

import org.owasp.esapi.ESAPI;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import java.io.IOException;

public class ESAPIEncodingFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization code, if needed.
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        // Wrap the response to override the getWriter() method with a custom writer.
        ESAPIResponseWrapper wrappedResponse = new ESAPIResponseWrapper(response);

        chain.doFilter(request, wrappedResponse);

        // Get the response content from the wrapped response and encode it using ESAPI.
        String encodedResponse = ESAPI.encoder().encodeForHTML(wrappedResponse.toString());

        // Write the encoded content to the original response.
        response.getWriter().write(encodedResponse);
    }

    @Override
    public void destroy() {
        // Cleanup code, if needed.
    }
}

import java.io.CharArrayWriter;
import java.io.PrintWriter;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

public class ESAPIResponseWrapper extends HttpServletResponseWrapper {
    private CharArrayWriter charArray = new CharArrayWriter();

    public ESAPIResponseWrapper(HttpServletResponse response) {
        super(response);
    }

    @Override
    public PrintWriter getWriter() {
        return new PrintWriter(charArray);
    }

    @Override
    public String toString() {
        return charArray.toString();
    }
}
