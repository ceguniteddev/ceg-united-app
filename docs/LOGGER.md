# Enhanced Google Cloud Logger

## Overview

The enhanced logger (`lib/logger.ts`) provides robust logging capabilities for the CEG United application with support for multiple logging modes, log levels, and serverless-optimized output.

**Key Features:**

- ✅ Multiple logging modes: API, stdout (LogSync), or both
- ✅ Log level filtering (debug, info, warn, error)
- ✅ Environment-based configuration
- ✅ Serverless-optimized with LogSync for Cloud Run/Functions
- ✅ Error handling with fallback to console-only logging
- ✅ Structured logging with metadata support
- ✅ Backwards compatible with existing codebase

## Migration Status

**Package Status:**

- `@google-cloud/logging` v11.2.1 is the latest version ✓
- The package is actively maintained in `googleapis/google-cloud-node` monorepo ✓
- The `nodejs-logging` repository is archived (organizational change only) ✓
- No breaking changes - all existing code continues to work ✓

**Implementation:**

- ✅ Migrated from basic Logging API to enhanced implementation
- ✅ Added LogSync support for serverless environments
- ✅ Added environment-based configuration
- ✅ Added error handling and fallback mechanisms
- ✅ Maintained backward compatibility with all 18 existing service files

## Environment Variables

### Required (Existing)

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### New Configuration Options

#### LOGGING_MODE (Optional)

Controls how logs are written:

- `api` - Write to Cloud Logging API only (async)
- `stdout` - Write to stdout using LogSync (recommended for serverless)
- `both` - Write to both API and stdout (default)

```bash
# Recommended for Cloud Run/Functions
LOGGING_MODE=stdout

# For App Engine or persistent servers
LOGGING_MODE=api

# For maximum reliability (default)
LOGGING_MODE=both
```

#### LOG_LEVEL (Optional)

Filters logs based on severity:

- `debug` - Log everything (most verbose)
- `info` - Log info, warn, error (default)
- `warn` - Log warnings and errors only
- `error` - Log errors only (least verbose)

```bash
# Production - reduce quota usage
LOG_LEVEL=error

# Development - see all logs
LOG_LEVEL=debug

# Default
LOG_LEVEL=info
```

#### NEXT_PUBLIC_ENVIRONMENT (Optional)

Used to separate logs by environment:

- Automatically creates log names: `ceg-united-app-${environment}-logs`
- Examples: `ceg-united-app-production-logs`, `ceg-united-app-staging-logs`

```bash
NEXT_PUBLIC_ENVIRONMENT=production
# or
NEXT_PUBLIC_ENVIRONMENT=development
```

## API Reference

### logInfo(message: string, data?: Record<string, any>): Promise<void>

Log informational messages.

```typescript
import { logInfo } from "@/lib/logger";

// Basic usage
await logInfo("User logged in");

// With metadata
await logInfo("User logged in", {
  userId: "user123",
  requestId: "req456",
});

// Function entry logging (common pattern)
await logInfo("getPlaidLinkToken::entry data", {
  userId,
  userToken,
  incomeSourceType,
});
```

### logError(err: Error, data?: Record<string, any>): Promise<void>

Log error messages with stack traces.

```typescript
import { logError } from "@/lib/logger";

try {
  // ... code that might throw
} catch (error) {
  await logError(error instanceof Error ? error : new Error("Unknown error"), {
    userId,
    operation: "updateUser",
  });
}

// With context
await logError(new Error("Plaid API failed"), {
  userId,
  itemId,
  endpoint: "/accounts/get",
});
```

### logWarn(message: string, data?: Record<string, any>): Promise<void>

Log warning messages.

```typescript
import { logWarn } from "@/lib/logger";

await logWarn("Rate limit approaching", {
  userId,
  remaining: 10,
});

await logWarn("Deprecated API usage", {
  endpoint: "/api/v1/old-endpoint",
});
```

### logDebug(message: string, data?: Record<string, any>): Promise<void>

Log debug messages (only when LOG_LEVEL=debug).

```typescript
import { logDebug } from "@/lib/logger";

await logDebug("Token validation", {
  token: token.substring(0, 10) + "...",
  expiresAt: new Date(exp * 1000).toISOString(),
});
```

## Structured Logging Best Practices

### Recommended Metadata Fields

For consistency across the codebase, use these standard fields:

```typescript
interface LogMetadata {
  // User context
  userId?: string; // User ID from auth
  brokerId?: string; // Broker ID if applicable

  // Request context
  requestId?: string; // Unique request identifier
  action?: string; // Action being performed
  resource?: string; // Resource being accessed

  // Error context
  errorCode?: string; // Application error code
  endpoint?: string; // API endpoint
  statusCode?: number; // HTTP status code

  // Additional context
  [key: string]: any; // Other relevant data
}
```

### Usage Examples

```typescript
// Service layer - function entry
await logInfo("applyFunding::entry", {
  userId,
  action: "apply_funding",
  resource: "funding_application",
});

// Service layer - success operation
await logInfo("Broker mapping updated successfully", {
  userId,
  brokerId,
  action: "update_broker_mapping",
});

// API route - error handling
await logError(error, {
  userId,
  action: "fetch_user_data",
  endpoint: req.url,
  requestId: req.headers.get("x-request-id"),
});

// State changes
await logInfo("Updating user status", {
  userId,
  oldStatus: "pending",
  newStatus: "active",
  action: "update_status",
});
```

## Deployment Recommendations

### Cloud Run / Cloud Functions (Serverless)

**Recommended Configuration:**

```bash
LOGGING_MODE=stdout
LOG_LEVEL=info
NEXT_PUBLIC_ENVIRONMENT=production
```

**Why:**

- LogSync writes to stdout, which Cloud Logging automatically captures
- Prevents log loss when instances terminate
- No need to await async API calls
- Lower latency (no network calls)

### App Engine / Compute Engine (Persistent)

**Recommended Configuration:**

```bash
LOGGING_MODE=api
LOG_LEVEL=info
NEXT_PUBLIC_ENVIRONMENT=production
```

**Why:**

- Long-lived instances can handle async API calls
- Direct API writes provide more control over log entries
- Lower stdout overhead

### Development / Staging

**Recommended Configuration:**

```bash
LOGGING_MODE=both
LOG_LEVEL=debug
NEXT_PUBLIC_ENVIRONMENT=development
```

**Why:**

- See all logs in both console and Cloud Logging
- Debug level for maximum visibility
- Separate log name for easier filtering

## Error Handling

The logger includes comprehensive error handling:

1. **Initialization Failures:** Falls back to console-only logging
2. **API Write Failures:** Logged to console without throwing
3. **LogSync Failures:** Falls back to JSON structured logging to stdout
4. **Missing Credentials:** Gracefully degrades to console output

Example console output when Cloud Logging unavailable:

```
[LOGGER] Failed to initialize Google Cloud Logging: <error>
[LOGGER] Falling back to console-only logging
[INFO] User logged in { userId: 'user123' }
```

## Viewing Logs

### Cloud Logging Console

```
# Filter by environment
logName="projects/YOUR_PROJECT/logs/ceg-united-app-production-logs"

# Filter by severity
severity >= ERROR

# Filter by user
jsonPayload.userId="user123"

# Combine filters
logName="projects/YOUR_PROJECT/logs/ceg-united-app-production-logs" AND severity >= WARNING AND jsonPayload.userId="user123"
```

### Local Development

Logs appear in terminal with prefix:

```
[INFO] User logged in { userId: 'user123' }
[ERROR] Plaid API failed { stack: '...', userId: 'user123' }
[WARN] Rate limit approaching { remaining: 10 }
[DEBUG] Token validation { token: 'eyJhbG...' }
```

## Performance Considerations

### Fire-and-Forget Pattern

The existing codebase uses fire-and-forget (no `await`):

```typescript
// Existing pattern in services
logInfo("Processing started", { userId }); // No await
processData(userId);
```

**Recommendation:**

- Keep fire-and-forget for non-critical logs
- Use `await` for critical error logs
- Consider `LOGGING_MODE=stdout` to eliminate async API calls

### Log Volume Optimization

1. **Use appropriate log levels:**

   ```typescript
   // ❌ Don't log verbose data at info level
   await logInfo("Processing", { data: hugeObject });

   // ✅ Use debug for verbose data
   await logDebug("Processing", { data: hugeObject });
   ```

2. **Set production log level:**

   ```bash
   # Production - only errors and warnings
   LOG_LEVEL=warn

   # Development - all logs
   LOG_LEVEL=debug
   ```

3. **Avoid logging in tight loops:**

   ```typescript
   // ❌ Don't do this
   for (const item of items) {
     await logInfo("Processing item", { item });
   }

   // ✅ Log summary instead
   await logInfo("Processing batch", {
     count: items.length,
     first: items[0]?.id,
     last: items[items.length - 1]?.id,
   });
   ```

## Migration Checklist

- [x] Verify package version (11.2.1 is latest)
- [x] Implement LogSync support
- [x] Add environment-based configuration
- [x] Add error handling and fallbacks
- [x] Maintain backward compatibility
- [x] Test TypeScript compilation
- [ ] Add unit tests (future enhancement)
- [ ] Update environment variables in deployment configs
- [ ] Monitor log entries in Cloud Logging console
- [ ] Adjust LOG_LEVEL based on production needs

## Troubleshooting

### Logs not appearing in Cloud Logging

1. Check credentials:

   ```typescript
   console.log(process.env.FIREBASE_PROJECT_ID); // Should be defined
   console.log(process.env.FIREBASE_CLIENT_EMAIL); // Should be defined
   ```

2. Check LOGGING_MODE:

   ```bash
   # Ensure it's not set to stdout only
   echo $LOGGING_MODE
   ```

3. Check service account permissions:
   - IAM role: `roles/logging.logWriter`
   - Enable Cloud Logging API

### Too many logs / High costs

1. Increase LOG_LEVEL:

   ```bash
   LOG_LEVEL=error  # Only errors
   ```

2. Review verbose logs:

   ```typescript
   // Replace info with debug for verbose logs
   await logDebug("Verbose data", { data }); // Only in development
   ```

3. Use log exclusion filters in Cloud Logging Console

### Console output too verbose

1. Set LOGGING_MODE:

   ```bash
   LOGGING_MODE=api  # Skip stdout output
   ```

2. Increase LOG_LEVEL:
   ```bash
   LOG_LEVEL=warn  # Skip info and debug
   ```

## Future Enhancements

Potential improvements for future implementation:

1. **OpenTelemetry Integration:**
   - Add trace/span ID context from HTTP headers
   - Correlate logs with distributed traces

2. **Batch Logging:**
   - Queue logs and write in batches
   - Reduce API calls for high-volume scenarios

3. **Custom Log Processors:**
   - Add PII redaction
   - Sanitize sensitive data automatically

4. **Metrics Integration:**
   - Track log volume by severity
   - Monitor error rates

5. **Log Sampling:**
   - Sample debug/info logs in production
   - Always log errors

## References

- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [@google-cloud/logging npm package](https://www.npmjs.com/package/@google-cloud/logging)
- [googleapis/google-cloud-node Repository](https://github.com/googleapis/google-cloud-node)
- [LogSync API Reference](https://googleapis.dev/nodejs/logging/latest/LogSync.html)
- [Best Practices for Cloud Logging](https://cloud.google.com/logging/docs/best-practices)
