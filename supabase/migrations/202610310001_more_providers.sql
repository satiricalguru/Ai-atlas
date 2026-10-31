alter table public.activity_events drop constraint if exists activity_events_provider_check;
alter table public.activity_events add constraint activity_events_provider_check check(provider in ('chatgpt','claude','gemini','cursor','copilot','perplexity','deepseek','kimi','grok','mistral','meta','qwen','other'));
