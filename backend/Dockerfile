ARG RUNTIME_IMAGE=eclipse-temurin@sha256:8c2dddf1bb2a8455160f4e23080059de5003eddc5cb839130b177c6be0c2cfe0
FROM ${RUNTIME_IMAGE}
ARG VCS_REF
LABEL org.opencontainers.image.revision="${VCS_REF}"
WORKDIR /app
COPY --chown=10001:10001 build/libs/app.jar /app/app.jar
USER 10001:10001
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60.0 -XX:InitialRAMPercentage=20.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 CMD curl --fail --silent --max-time 4 http://127.0.0.1:8080/actuator/health/liveness >/dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
