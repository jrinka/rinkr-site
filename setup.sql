create table clippings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text,
  tag text not null check (tag in ('news', 'edu', 'gaming', 'art', 'music', 'read', 'watch', 'weird', 'other')),
  note text,
  created_at timestamptz default now()
);

alter table clippings enable row level security;
