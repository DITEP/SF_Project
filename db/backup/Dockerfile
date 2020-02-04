FROM alpine:latest

COPY ./db_save /etc/periodic/daily/

RUN apk update && \
    apk upgrade && \
    apk add --no-cache mariadb-client && \
    chmod a+x /etc/periodic/daily/* && \
    mkdir /dbbackup