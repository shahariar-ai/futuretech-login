/* =========================================================
   Loaded as a classic (non-module) script at the top of
   <head>, so it runs before the page is first shown.

   Chromium sometimes skips a cross-document view transition
   (e.g. when the next page is ready to show very early). The
   navigation still works, but the skipped transition's
   internal promise surfaces as "Uncaught (in promise)
   InvalidStateError: Transition was aborted…". That one
   harmless error is marked as handled here; every other
   error is left alone.
   ========================================================= */
window.addEventListener('unhandledrejection', function (event) {
  var reason = event.reason;
  if (reason && reason.name === 'InvalidStateError' && /Transition was (aborted|skipped)/.test(String(reason.message))) {
    event.preventDefault();
  }
});
