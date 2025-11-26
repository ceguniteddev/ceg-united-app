# Session Implementation Testing Guide

## ✅ Automated Validation Results

**Status**: All validations passed ✅

### Configuration Summary

- **Session Duration**: 6 hours (21,600,000 ms)
- **Session Cookie MaxAge**: 6 hours (21,600 seconds)
- **Refresh Interval**: 30 minutes (1,800,000 ms)
- **Refreshes per Session**: 12 times (every 30 minutes)
- **Security**: httpOnly, sameSite=lax, secure in production

### Validation Script

Run the validation script anytime to confirm configuration:

```bash
npx tsx scripts/validate-session.ts
```

## 📋 Implementation Files Verified

### 1. `lib/session.ts`

✅ **createSession()**: expiresIn = 6 _ 60 _ 60 _ 1000 (6 hours)
✅ **refreshSession()**: expiresIn = 6 _ 60 _ 60 _ 1000 (6 hours)
✅ **verifySession()**: Checks revocation, handles expired/revoked sessions
✅ **logoutSession()**: Deletes auth_token cookie

### 2. `provider/AuthContext.tsx`

✅ **checkAndRefreshSession()**: Runs every 30 _ 60 _ 1000 ms (30 minutes)
✅ **Initial check**: After 2 seconds on mount
✅ **Refresh logic**: Gets fresh Firebase ID token, calls /api/auth/refresh-session
✅ **Error handling**: Logs out user if session invalid

### 3. `app/api/auth/refresh-session/route.ts`

✅ **POST endpoint**: Accepts idToken in body
✅ **Validation**: Checks idToken presence
✅ **Response**: Returns success:true or error

## 🧪 Manual Testing Checklist

### Test 1: Login & Session Creation

**Steps:**

1. Open browser DevTools (F12)
2. Go to: Application → Cookies → Select your domain
3. Login to the application
4. Look for `auth_token` cookie

**Expected Results:**

- ✅ `auth_token` cookie exists
- ✅ Cookie expires in ~6 hours from login time
- ✅ HttpOnly flag is checked
- ✅ SameSite = Lax
- ✅ Secure flag checked (production only)

**Screenshot locations:**

- Application tab → Cookies section

---

### Test 2: Auto-Refresh Mechanism (30 Minutes)

**Steps:**

1. Login to the application
2. Open DevTools → Network tab
3. Filter for "refresh" or "refresh-session"
4. Keep browser tab open
5. Wait 2 seconds for initial check
6. Wait 30 minutes for first refresh (or reduce interval in code for testing)

**Expected Results:**

- ✅ After 2 seconds: POST to `/api/auth/verify-session` (initial check)
- ✅ After 30 minutes: POST to `/api/auth/refresh-session`
- ✅ Response status: 200 OK
- ✅ Response body: `{ "success": true }`
- ✅ `auth_token` cookie expiration extends by 6 hours
- ✅ User remains logged in (no redirect to login)

**Console logs to check:**

```
Session is valid
Refreshing session...
Session refreshed successfully
```

**Note:** To test faster, temporarily change interval in `AuthContext.tsx`:

```tsx
// For testing: refresh every 2 minutes instead of 30
const intervalId = setInterval(checkAndRefreshSession, 2 * 60 * 1000);
```

---

### Test 3: Session Verification on API Calls

**Steps:**

1. Login to the application
2. Navigate to any protected route (e.g., dashboard)
3. Open DevTools → Network tab
4. Perform any action that triggers an API call
5. Check the network requests

**Expected Results:**

- ✅ API calls include `auth_token` cookie automatically
- ✅ No 401 Unauthorized errors
- ✅ Data loads successfully
- ✅ No logout/redirect occurs

---

### Test 4: Session Expiration (6 Hours Inactive)

**Steps:**

1. Login to the application
2. Note the current time
3. **Close the browser tab** (stops auto-refresh)
4. Wait 6+ hours
5. Reopen the application URL

**Expected Results:**

- ✅ Redirected to login page
- ✅ `auth_token` cookie deleted or expired
- ✅ Cannot access protected routes
- ✅ Error message: "Session expired" or similar

**Alternative Test (Faster):**
Manually delete the `auth_token` cookie:

1. DevTools → Application → Cookies
2. Right-click `auth_token` → Delete
3. Try to access protected route
4. Should redirect to login

---

### Test 5: Manual Logout

**Steps:**

1. Login to the application
2. Verify session exists (check cookies)
3. Click the Logout button
4. Check DevTools → Application → Cookies
5. Try to access a protected route

**Expected Results:**

- ✅ `auth_token` cookie is deleted
- ✅ Redirected to login page
- ✅ Cannot access protected routes without re-login
- ✅ Network tab shows no valid session cookie

---

### Test 6: Multiple Tabs (Concurrent Sessions)

**Steps:**

1. Login in one tab (Tab A)
2. Open the app in a second tab (Tab B)
3. Keep both tabs open for 30+ minutes
4. Check Network tab in both tabs

**Expected Results:**

- ✅ Both tabs share the same `auth_token` cookie
- ✅ Both tabs independently refresh the session
- ✅ Session extends properly in both tabs
- ✅ No conflicts or logout issues

---

### Test 7: Idle User with Tab Open

**Steps:**

1. Login to the application
2. Keep the browser tab open
3. Do NOT interact with the app (leave it idle)
4. Check Network tab every 30 minutes

**Expected Results:**

- ✅ Auto-refresh still occurs every 30 minutes
- ✅ Session remains valid
- ✅ User stays logged in indefinitely (as long as tab open)
- ✅ No logout after 6 hours (because session keeps refreshing)

---

### Test 8: Production Security Settings

**Environment:** Production only

**Steps:**

1. Deploy to production with `ENVIRONMENT=production`
2. Login to the app (HTTPS required)
3. Check DevTools → Application → Cookies

**Expected Results:**

- ✅ `auth_token` cookie has Secure flag checked
- ✅ Cookie only sent over HTTPS
- ✅ HTTP connections blocked from accessing cookie

---

## 🎯 Expected Behavior Summary

| Scenario                     | Auto-Refresh             | Session Duration           | Outcome                                |
| ---------------------------- | ------------------------ | -------------------------- | -------------------------------------- |
| Active user (interacting)    | ✅ Every 30 min          | Extended indefinitely      | Stays logged in                        |
| Idle user (tab open)         | ✅ Every 30 min          | Extended indefinitely      | Stays logged in                        |
| Closed browser               | ❌ Stopped               | Max 6 hours remaining      | Logout after expiration                |
| Manual logout                | ❌ Stopped               | Deleted immediately        | Immediate logout                       |
| Network error during refresh | ⚠️ Retries next interval | Continues until expiration | May logout if refresh fails repeatedly |

## 🔍 Debugging Tips

### Check Console Logs

Look for these messages in browser console:

- `"Session is valid"` - Session verification succeeded
- `"Refreshing session..."` - Auto-refresh initiated
- `"Session refreshed successfully"` - Refresh completed
- `"Session is invalid"` - Session expired/revoked
- `"Session timeout"` - Firebase session issue

### Network Tab Filters

Filter Network tab for:

- `refresh-session` - Session refresh calls
- `verify-session` - Session verification calls
- `logout` - Logout endpoint calls
- Status code `401` - Unauthorized (session issues)

### Cookie Inspection

Check these cookie attributes:

- **Name**: `auth_token`
- **Value**: Long JWT string (don't share publicly)
- **Expires**: Should be ~6 hours from last refresh
- **HttpOnly**: ✅ Checked
- **Secure**: ✅ Checked (production only)
- **SameSite**: Lax

### Common Issues

**Issue**: Session expires unexpectedly

- Check: Is the browser tab actually open?
- Check: Are there any console errors during refresh?
- Check: Is the Firebase ID token valid?

**Issue**: Auto-refresh not happening

- Check: Is the interval code running? (Set a console.log)
- Check: Is there a JavaScript error blocking execution?
- Check: Is the component mounted properly?

**Issue**: Cookies not being set

- Check: Is the domain correct?
- Check: Is HTTPS enabled (production)?
- Check: Are third-party cookies blocked?

**Issue**: 401 Unauthorized on API calls

- Check: Does the `auth_token` cookie exist?
- Check: Is the session expired?
- Check: Is the Firebase Admin SDK configured correctly?

## 📊 Performance Metrics

### Expected Network Activity

- **Initial login**: 1-2 requests (login + create session)
- **Every 30 minutes**: 2 requests (verify + refresh)
- **Per hour**: ~4 requests (2 refresh cycles)
- **Per day**: ~96 requests (48 refresh cycles)

### Browser Impact

- **Memory**: Minimal (interval timer + listeners)
- **CPU**: Negligible (only during refresh)
- **Network**: ~4 KB per refresh cycle
- **Battery**: Minimal impact (30-minute intervals)

## ✅ Test Results Template

Copy this template to document your test results:

```
# Session Testing Results

**Date**: [Date]
**Environment**: [Development/Staging/Production]
**Tester**: [Your Name]
**Browser**: [Chrome/Firefox/Safari] [Version]

## Test Results

- [ ] Test 1: Login & Session Creation
- [ ] Test 2: Auto-Refresh Mechanism
- [ ] Test 3: Session Verification on API Calls
- [ ] Test 4: Session Expiration (6 Hours)
- [ ] Test 5: Manual Logout
- [ ] Test 6: Multiple Tabs
- [ ] Test 7: Idle User with Tab Open
- [ ] Test 8: Production Security Settings

## Issues Found

[None / List any issues]

## Notes

[Any additional observations]

## Conclusion

✅ All tests passed
⚠️ Some tests failed (see issues)
❌ Critical failures found
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run validation script: `npx tsx scripts/validate-session.ts`
- [ ] Verify all automated validations pass
- [ ] Complete manual testing checklist
- [ ] Test in staging environment first
- [ ] Verify `ENVIRONMENT=production` sets Secure flag
- [ ] Monitor session refresh logs in production
- [ ] Set up alerts for session-related errors
- [ ] Document any issues found during testing
- [ ] Inform users about improved session duration

## 📞 Support

If you encounter issues:

1. Check the debugging tips section above
2. Review console logs and network activity
3. Verify Firebase Admin SDK configuration
4. Check environment variables are set correctly
5. Test in development environment first

## 🔗 Related Files

- Implementation: `lib/session.ts`
- Client-side refresh: `provider/AuthContext.tsx`
- Refresh endpoint: `app/api/auth/refresh-session/route.ts`
- Validation tests: `__tests__/lib/session.test.ts`
- Validation script: `scripts/validate-session.ts`
