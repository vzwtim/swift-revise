-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $
begin
  -- Debug: Insert raw user meta data into the debug table
  insert into public.debug_raw_user_meta (user_id, meta_data)
  values (new.id, new.raw_user_meta_data);

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '名無しさん'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$;

-- Trigger to call the function after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();