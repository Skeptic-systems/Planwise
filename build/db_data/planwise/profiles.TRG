TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER trg_profiles_set_updated_at\nBEFORE UPDATE ON profiles\nFOR EACH ROW\nBEGIN\n  SET NEW.updated_at = CURRENT_TIMESTAMP;\nEND'
sql_modes=1411383296
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_unicode_ci'
db_cl_names='utf8mb4_uca1400_ai_ci'
created=1755544141592107
