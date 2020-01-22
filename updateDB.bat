psql -U postgres -c "drop database IF EXISTS onsite;"
psql -U postgres -c "create database onsite with owner postgres encoding = 'UNICODE';"
psql -U postgres -d onsite -f onsite.sql
pause