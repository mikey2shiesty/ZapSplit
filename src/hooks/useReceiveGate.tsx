import React, { useState, useCallback } from 'react';
import { useStripeAccountStatus } from './useStripeAccountStatus';
import VerifyIdRequiredModal from '../components/modals/VerifyIdRequiredModal';

/**
 * Verification gate for the moment a split is actually CREATED (i.e. the point
 * a payable link goes live), not the moment the flow is entered.
 *
 * Rationale: gating at flow-entry blocked brand-new users before they saw any
 * value (scan → build → review), which killed activation. We now let them do
 * the whole flow and only require ID verification at the final "Create split"
 * tap. This is the correct checkpoint because a split can't be created — and so
 * no unverified/broken payment link can ever be shared — until the creator can
 * actually receive money. (Stripe/AU banking rules make verification
 * unavoidable to receive funds; this only moves *when* we ask.)
 *
 * Usage in a create screen:
 *   const { ensureCanReceive, gate } = useReceiveGate();
 *   const handleCreate = async () => {
 *     if (!ensureCanReceive()) return;   // shows the verify modal, aborts create
 *     ...create the split...
 *   };
 *   return (<View>...{gate}</View>);
 */
export function useReceiveGate() {
  const stripeStatus = useStripeAccountStatus();
  const canReceive =
    stripeStatus.payoutsEnabled && stripeStatus.currentlyDue.length === 0;
  const [visible, setVisible] = useState(false);

  // Returns true if the caller may proceed to create the split.
  // If the user can't yet receive money, shows the verify modal and returns
  // false so the caller can bail out before creating anything.
  const ensureCanReceive = useCallback((): boolean => {
    // While status is still loading, proceed optimistically — the payment-intent
    // edge function still blocks charges to unverified receivers as a backstop.
    if (stripeStatus.loading) return true;
    if (!canReceive) {
      setVisible(true);
      return false;
    }
    return true;
  }, [stripeStatus.loading, canReceive]);

  const gate = (
    <VerifyIdRequiredModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Verify your ID to send this split"
      message="Your split collects money for you. Finish verifying your ID so your friends' payments can reach your bank — it takes under a minute."
    />
  );

  return { canReceive, ensureCanReceive, gate };
}
