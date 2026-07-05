alter table posts add column caption text;
alter table posts add constraint caption_length check (char_length(caption) <= 250);
