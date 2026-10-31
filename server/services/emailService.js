// Email notification service simulator with production SMTP readiness
export const sendVerificationEmail = async ({ email, name, token, frontendUrl }) => {
  const verifyLink = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  console.log(`\n======================================================`);
  console.log(`[BRIGHTLOOP NOTIFICATION ENGINE] Email Verification Dispatched`);
  console.log(`Recipient: ${name} <${email}>`);
  console.log(`Verification URL: ${verifyLink}`);
  console.log(`Verification Token: ${token}`);
  console.log(`======================================================\n`);
  return { success: true, verifyLink };
};

export const sendPasswordResetEmail = async ({ email, name, token, frontendUrl }) => {
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  console.log(`\n======================================================`);
  console.log(`[BRIGHTLOOP NOTIFICATION ENGINE] Password Reset Request`);
  console.log(`Recipient: ${name || 'User'} <${email}>`);
  console.log(`Reset URL: ${resetLink}`);
  console.log(`Reset Token: ${token}`);
  console.log(`======================================================\n`);
  return { success: true, resetLink };
};

