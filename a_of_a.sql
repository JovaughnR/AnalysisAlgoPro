create database a_of_a_student_participation;
-- drop database a_of_a_student_participation;
use a_of_a_student_participation;

create table user (
    user_id BIGINT primary key,
    first_name varchar(20),
    last_name varchar(20),
    email varchar(35),
);
insert into user values (111111, "john", "jones", "johnjones@gmail.com");

ALTER TABLE user drop COLUMN title;

create table user_authentication (
    user_id BIGINT primary key,
    user_password varchar(65),
    foreign key(user_id) references user(user_id)
);

create table module (
    module_code varchar(10) primary key,
    module_name varchar(35),
    lecturer_id BIGINT,
    Foreign Key (lecturer_id) REFERENCES user(user_id)
);

create table session_dialogs (
    module_code VARCHAR(10) PRIMARY KEY,
    message varchar(5000),
    date DATE, 
    lecturer_id BIGINT,
    Foreign Key (lecturer_id) REFERENCES user(user_id),
    Foreign Key (module_code) REFERENCES module(module_code)
);


select * from student_participation;
select * from user;
select * from user_authentication;
select * from module;


update user 
set first_name = "Dr. Arnett", 
last_name = "Campbell" 
where user_id = 2111876;

delete from user_authentication where user_id = 2111876;

delete from module where lecturer_id = 2111876;

delete from user where user_id = 2111876;

delete from module;

delete from user_authentication;

delete from user;