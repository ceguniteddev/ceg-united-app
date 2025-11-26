# Session Implementation - Quick Reference

## ✅ Validation Status

**All automated validations passed!** ✅

Run validation anytime:

```bash
npx tsx scripts/validate-session.ts
```

## 📊 Configuration

| Setting               | Value      | Notes            |
| --------------------- | ---------- | ---------------- |
| **Session Duration**  | 6 hours    | 21,600,000 ms    |
| **Cookie MaxAge**     | 6 hours    | 21,600 seconds   |
| **Refresh Interval**  | 30 minutes | 1,800,000 ms     |
| **Initial Check**     | 2 seconds  | On app mount     |
| **Refreshes/Session** | 12 times   | Every 30 minutes |

## 🔒 Security

| Feature     | Status       | Environment     |
| ----------- | ------------ | --------------- |
| HttpOnly    | ✅ Enabled   | All             |
| Secure      | ✅ Enabled   | Production only |
| SameSite    | ✅ Lax       | All             |
| Path        | `/`          | All             |
| Cookie Name | `auth_token` | All             |

## 🎯 User Experience

| User Type           | Behavior                                          |
| ------------------- | ------------------------------------------------- |
| **Active**          | ✅ Never logged out (refreshes every 30 min)      |
| **Idle (tab open)** | ✅ Never logged out (auto-refresh continues)      |
| **Closed browser**  | ⏱️ Session valid for remaining time (max 6 hours) |
| **Manual logout**   | 🚪 Immediate logout (cookie deleted)              |

## 🧪 Quick Test

**Fast validation** (2 minutes):

1. Login to app
2. Open DevTools → Application → Cookies
3. Verify `auth_token` exists with 6-hour expiration
4. Open Network tab
5. Wait 2 seconds → See `/api/auth/verify-session` call
6. Session is valid! ✅

**Full test** (see `docs/SESSION_TESTING_GUIDE.md`):

- 8 comprehensive test scenarios
- Manual testing checklist
- Debugging tips
- Performance metrics

## 📁 Implementation Files

```
lib/
  └── session.ts                      # Server-side session management
provider/
  └── AuthContext.tsx                 # Client-side auto-refresh
app/
  └── api/
      └── auth/
          ├── refresh-session/
          │   └── route.ts            # Refresh endpoint
          └── verify-session/
              └── route.ts            # Verification endpoint
__tests__/
  └── lib/
      └── session.test.ts            # Validation functions
scripts/
  └── validate-session.ts            # Validation script
docs/
  └── SESSION_TESTING_GUIDE.md       # Comprehensive testing guide
```

## 🔧 Key Functions

### Server-side (`lib/session.ts`)

```typescript
createSession(idToken: string)       // Create 6-hour session
refreshSession(idToken: string)      // Extend session by 6 hours
verifySession(sessionCookie: string) // Verify session validity
logoutSession()                      // Delete session cookie
```

### Client-side (`provider/AuthContext.tsx`)

```typescript
checkAndRefreshSession(); // Verify + refresh session
// Runs: 2 seconds (initial) → every 30 minutes
```

## 📈 Network Activity

| Event         | Endpoint                    | Frequency                |
| ------------- | --------------------------- | ------------------------ |
| Initial check | `/api/auth/verify-session`  | Once (2 sec after mount) |
| Auto-refresh  | `/api/auth/refresh-session` | Every 30 minutes         |
| API calls     | Protected endpoints         | As needed                |
| Logout        | `/api/auth/logout`          | On user logout           |

## ⚠️ Important Notes

1. **Active users stay logged in indefinitely** (session refreshes automatically)
2. **Inactive users logged out after 6 hours** (if browser closed)
3. **Tab must be open** for auto-refresh to work
4. **Secure flag only in production** (HTTPS required)
5. **Cookie is httpOnly** (JavaScript cannot access it)

## 🐛 Troubleshooting

**Session expires unexpectedly?**

- Check if browser tab is open
- Check console for refresh errors
- Verify Firebase ID token is valid

**Auto-refresh not working?**

- Check Network tab for refresh calls
- Look for JavaScript errors in console
- Verify AuthContext is mounted

**401 Unauthorized errors?**

- Check if `auth_token` cookie exists
- Verify session hasn't expired
- Test in development environment first

## ✅ Pre-Deployment Checklist

- [ ] Run `npx tsx scripts/validate-session.ts`
- [ ] All validations pass
- [ ] Manual testing completed (see testing guide)
- [ ] Tested in staging environment
- [ ] Production environment variables set
- [ ] Monitoring/alerts configured

## 📚 Documentation

- **Full Testing Guide**: `docs/SESSION_TESTING_GUIDE.md`
- **Validation Tests**: `__tests__/lib/session.test.ts`
- **Validation Script**: `scripts/validate-session.ts`

---

**Last Validated**: Run `npx tsx scripts/validate-session.ts` to see current status
