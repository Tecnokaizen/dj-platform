# Staging Deployment and Recovery Runbook

## Status

This runbook is executable Phase A documentation. No staging environment is
currently claimed. Production is not authorized.

## Release sequence

1. Record the immutable Git SHA and image digest.
2. Verify an external encrypted backup and recent isolated restore evidence.
3. Run the PostgreSQL role bootstrap through an administrator connection.
4. Run exactly one migrator job: Prisma, Supabase, seed, validation.
5. Deploy the runner image without migration credentials.
6. Require `/api/health` and `/api/ready` to pass.
7. Exercise registration confirmation, callback, login, Organization access,
   permission denial and tenant isolation.
8. Observe application, Auth, REST, database and container logs before traffic.

## Application rollback

Application rollback means redeploying a previous immutable image digest only
when its schema compatibility with the current database has been confirmed.
Never run down-migrations automatically. If an applied schema change is not
backward compatible, stop traffic and use a reviewed forward-fix.

## Migration failure

- stop the release before web deployment;
- preserve migrator logs and both migration ledgers;
- do not edit an applied migration or use `prisma db push`;
- determine whether retry is idempotent or a forward-fix is required;
- restore only into an isolated database unless an incident commander
  explicitly authorizes a destructive environment recovery.

## Backup failure

A failed backup, retention, repository check or restore drill blocks a staging
readiness claim. Coolify is not the only copy of recovery credentials; the
external operator-controlled vault is required.

## Restore drill

1. Create a new isolated empty database.
2. Set `RESTORE_CONFIRM_DATABASE` to its exact name.
3. Set `ALLOW_ISOLATED_RESTORE=YES_I_UNDERSTAND`.
4. Run `scripts/backup/restore-postgres.sh` through `Dockerfile.backup`.
5. Require both migration ledgers and canonical Role/Permission catalogs.
6. Perform application-level smoke checks against the restored database.
7. Record elapsed time and verify RTO <= 4 hours.
8. Remove the isolated database only after preserving evidence.

## Stop conditions

Stop for shared data between environments, public database/Mailpit, mutable or
unidentified images, runtime owner credentials, migration from web replicas,
failed CI/readiness, secret leakage, missing external backup, restore failure,
or any unreviewed Platform Core architecture change.
