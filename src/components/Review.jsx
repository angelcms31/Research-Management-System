// Verify / Return actions for coordinators & administrators (Documentation §8.2 approval workflow).
import React, { useState } from 'react';
import { Btn, FormField, IconBtn, Modal, Textarea, useToast } from './ui.jsx';
import { getUser, setRecordStatus, useStore } from '../store.js';
import { canApprove } from '../perm.js';

export default function ReviewActions({ rec, compact }) {
  const state = useStore();
  const user = getUser(state);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  if (!canApprove(state.db, user, rec)) return null;

  const verify = () => { setRecordStatus(rec.id, 'verified'); toast('Record verified.', 'success'); };
  const send = () => {
    if (reason.trim().length < 5) { setErr('Please give the author a reason (at least 5 characters).'); return; }
    setRecordStatus(rec.id, 'returned', reason.trim());
    toast('Record returned to the author.', 'info');
    setOpen(false); setReason(''); setErr('');
  };
  return (
    <>
      {compact ? <>
        <IconBtn icon="check" label="Verify record" color="#2E7D4F" onClick={verify} />
        <IconBtn icon="undo" label="Return to author" color="#B7791F" onClick={() => setOpen(true)} />
      </> : <>
        <Btn variant="success" icon="check" onClick={verify}>Verify record</Btn>
        <Btn variant="ghost" icon="undo" onClick={() => setOpen(true)}>Return to author</Btn>
      </>}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Return record to author" width={460}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={send}>Return record</Btn></>}>
        <p style={{ fontSize: 14, color: '#5C6B7A', marginBottom: 12, lineHeight: 1.5 }}>“{rec.title}” will go back to its author, who can edit and resubmit it.</p>
        <FormField label="Reason" required error={err}><Textarea value={reason} onChange={setReason} rows={3} placeholder="What should the author fix?" error={err} /></FormField>
      </Modal>
    </>
  );
}
