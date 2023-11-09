#!/usr/bin/env sh


# Determine whether we are running in code engine or locally for dev
if [ -z "$CE_APP" ]; then
    echo "Running locally"
else
    # NOTE: This is required because flowise expects the database information to be in the DATABASE_* env vars
    # but code engine gives us a big JSON that contains the required information
    echo "Running in code engine"
    CONN=$DATABASES_FOR_POSTGRESQL_CONNECTION

    export DATABASE_TYPE=postgres
    export DATABASE_PORT="$(echo $CONN | jq -r '.postgres.hosts[0].port')"
    export DATABASE_HOST="$(echo $CONN | jq -r '.postgres.hosts[0].hostname')"
    export DATABASE_NAME="$(echo $CONN | jq -r '.postgres.database')"
    export DATABASE_USER="$(echo $CONN | jq -r '.postgres.authentication.username')"
    export DATABASE_PASSWORD="$(echo $CONN | jq -r '.postgres.authentication.password')"
    # NOTE: This is not a standard flowise environment variable, but we added it in our custom DataSource.js
    # to support the required SSL configuration for IBM Cloud
    export DATABASE_SSL=true
fi

yarn start
