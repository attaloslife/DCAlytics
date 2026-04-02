create unique index if not exists profiles_display_name_unique_idx
on public.profiles ((lower(display_name)))
where display_name is not null;
