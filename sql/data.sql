create table t_log (
    id int auto_increment comment 'Session ID' primary key,
    type varchar(255) charset utf8 null comment 'Type of action',
    message varchar(255) charset utf8 null comment 'Action message'
);
create table t_email_log (
    log_id int not null primary key,
    subject varchar(255) charset utf8 null,
    body text charset utf8 null,
    sender varchar(255) null,
    recipient varchar(255) null,
    delivery_status enum ('SENT', 'FAILED', 'WARN') default 'FAILED' null,
    message varchar(255) null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint fk_email_log foreign key (log_id) references t_log (id) on update cascade on delete cascade
);
create table t_whitelist (
    id varchar(255) charset utf8 not null comment 'Guild ID whitelist' primary key,
    type enum ('USER', 'GUILD') default 'GUILD' null,
    created_at timestamp default CURRENT_TIMESTAMP null
);