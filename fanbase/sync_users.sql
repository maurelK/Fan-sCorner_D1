-- Sync missing users from auth.users to public.users
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', ''), 
    COALESCE(raw_user_meta_data->>'role', 'fan'),
    created_at,
    created_at
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users);

-- Ensure RLS doesn't block inserts if policies are weird (though they looked ok)
-- (No change to policies, just sync data)
