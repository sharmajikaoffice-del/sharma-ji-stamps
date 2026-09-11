warning: in the working copy of 'supabse/rubbers_items.sql', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/rubbers_items.sql b/rubbers_items.sql[m
[1mdeleted file mode 100644[m
[1mindex 63372ff..0000000[m
[1m--- a/rubbers_items.sql[m
[1m+++ /dev/null[m
[36m@@ -1,17 +0,0 @@[m
[31m--- Run this once in Supabase SQL Editor for the Item Master categories/sizes.[m
[31m-ALTER TABLE public.rubbers[m
[31m-  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'rubber';[m
[31m-[m
[31m-ALTER TABLE public.rubbers[m
[31m-  ADD COLUMN IF NOT EXISTS size text;[m
[31m-[m
[31m-UPDATE public.rubbers[m
[31m-SET category = 'rubber'[m
[31m-WHERE category IS NULL OR trim(category) = '';[m
[31m-[m
[31m-ALTER TABLE public.rubbers[m
[31m-  DROP CONSTRAINT IF EXISTS rubbers_category_check;[m
[31m-[m
[31m-ALTER TABLE public.rubbers[m
[31m-  ADD CONSTRAINT rubbers_category_check[m
[31m-  CHECK (category IN ('machine', 'raw', 'rubber'));[m
[1mdiff --git a/supabse/rubbers_items.sql b/supabse/rubbers_items.sql[m
[1mindex a9982e2..63372ff 100644[m
[1m--- a/supabse/rubbers_items.sql[m
[1m+++ b/supabse/rubbers_items.sql[m
[36m@@ -1,12 +1,10 @@[m
[31m--- Run this once in Supabase SQL Editor.[m
[31m--- Adds the three item categories and stamp impression size.[m
[32m+[m[32m-- Run this once in Supabase SQL Editor for the Item Master categories/sizes.[m
 ALTER TABLE public.rubbers[m
   ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'rubber';[m
 [m
 ALTER TABLE public.rubbers[m
   ADD COLUMN IF NOT EXISTS size text;[m
 [m
[31m--- Existing items remain Rubber items by default.[m
 UPDATE public.rubbers[m
 SET category = 'rubber'[m
 WHERE category IS NULL OR trim(category) = '';[m
