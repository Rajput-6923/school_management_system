import { Router } from 'express';
import { pool, withTransaction } from '../db.js';
import { requireAuth, requireRoles } from '../auth.js';
import { invoiceSchema, noticeSchema, parseBody, paymentSchema, settingsSchema } from '../schemas.js';

const router = Router();
router.use(requireAuth);

export async function getInvoices(client = pool) {
  const { rows: invoices } = await client.query(`SELECT id,invoice_no AS "invoiceNo",student_id AS "studentId",student_name AS "studentName",
    class_id AS "classId",class_name AS "className",fee_type AS "feeType",amount,to_char(due_date,'YYYY-MM-DD') AS "dueDate",status,
    academic_term AS "academicTerm",to_char(created_at,'YYYY-MM-DD') AS "createdAt" FROM fee_invoices ORDER BY created_at DESC`);
  const { rows: payments } = await client.query(`SELECT id,invoice_id AS "invoiceId",amount,to_char(payment_date,'YYYY-MM-DD') AS "paymentDate",
    payment_method AS "paymentMethod",transaction_ref AS "transactionRef",notes FROM fee_payments ORDER BY payment_date,id`);
  const paymentMap = new Map();
  for (const payment of payments) {
    payment.amount = Number(payment.amount);
    if (!paymentMap.has(payment.invoiceId)) paymentMap.set(payment.invoiceId, []);
    paymentMap.get(payment.invoiceId).push(payment);
  }
  return invoices.map((invoice) => {
    const invoicePayments = paymentMap.get(invoice.id) || [];
    const paidAmount = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    return { ...invoice, amount: Number(invoice.amount), paidAmount, payments: invoicePayments };
  });
}

export async function getNotices(client = pool) {
  const { rows } = await client.query(`SELECT id,title,content,category,priority,target_audience AS "targetAudience",
    to_char(published_date,'YYYY-MM-DD') AS "publishedDate",to_char(expiry_date,'YYYY-MM-DD') AS "expiryDate",is_pinned AS "isPinned",author_name AS "authorName"
    FROM notices ORDER BY is_pinned DESC,published_date DESC,created_at DESC`);
  return rows;
}

const defaultSettings = {
  schoolName: 'EduFlow School', motto: '', establishedYear: '', principalName: '', email: 'admin@example.com', phone: '', address: '',
  website: '', academicYear: new Date().getFullYear().toString(), currencySymbol: '$', gradingScale: [],
};
export async function getSettings(client = pool) {
  const { rows } = await client.query(`SELECT school_name AS "schoolName",motto,established_year AS "establishedYear",principal_name AS "principalName",
    email,phone,address,website,academic_year AS "academicYear",currency_symbol AS "currencySymbol",grading_scale AS "gradingScale" FROM school_settings WHERE id=TRUE`);
  return rows[0] || defaultSettings;
}

router.get('/invoices', requireRoles('Admin', 'Bursar'), async (_req, res, next) => {
  try { res.json(await getInvoices()); } catch (error) { next(error); }
});
router.post('/invoices', requireRoles('Admin', 'Bursar'), async (req, res, next) => {
  try {
    const x = parseBody(invoiceSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO fee_invoices (id,invoice_no,student_id,student_name,class_id,class_name,fee_type,amount,due_date,status,academic_term)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [x.id, x.invoiceNo, x.studentId, x.studentName, x.classId, x.className, x.feeType, x.amount, x.dueDate, x.status, x.academicTerm]
    );
    res.status(201).json((await getInvoices()).find((invoice) => invoice.id === rows[0].id));
  } catch (error) { next(error); }
});
router.delete('/invoices/:id', requireRoles('Admin', 'Bursar'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM fee_invoices WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Invoice not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});
router.post('/invoices/:id/payments', requireRoles('Admin', 'Bursar'), async (req, res, next) => {
  try {
    const x = parseBody(paymentSchema, req.body);
    const invoice = await withTransaction(async (client) => {
      const { rows } = await client.query('SELECT amount,due_date FROM fee_invoices WHERE id=$1 FOR UPDATE', [req.params.id]);
      if (!rows[0]) return null;
      const { rows: paidRows } = await client.query('SELECT COALESCE(SUM(amount),0) AS total FROM fee_payments WHERE invoice_id=$1', [req.params.id]);
      const totalPaid = Number(paidRows[0].total);
      const remaining = Number(rows[0].amount) - totalPaid;
      if (x.amount > remaining) {
        const error = new Error('Payment amount exceeds the outstanding balance.'); error.status = 400; throw error;
      }
      await client.query(
        'INSERT INTO fee_payments (id,invoice_id,amount,payment_date,payment_method,transaction_ref,notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [x.id, req.params.id, x.amount, x.paymentDate, x.paymentMethod, x.transactionRef, x.notes || null]
      );
      const paid = totalPaid + x.amount;
      const status = paid >= Number(rows[0].amount) ? 'Paid' : paid > 0 ? 'Partial' : (new Date(rows[0].due_date) < new Date() ? 'Overdue' : 'Pending');
      await client.query('UPDATE fee_invoices SET status=$2 WHERE id=$1', [req.params.id, status]);
      return (await getInvoices(client)).find((record) => record.id === req.params.id);
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.status(201).json(invoice);
  } catch (error) { next(error); }
});

router.get('/notices', async (_req, res, next) => {
  try { res.json(await getNotices()); } catch (error) { next(error); }
});
router.post('/notices', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(noticeSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO notices (id,title,content,category,priority,target_audience,published_date,expiry_date,is_pinned,author_name)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::date,CURRENT_DATE),$8,$9,$10) RETURNING id`,
      [x.id, x.title, x.content, x.category, x.priority, x.targetAudience, x.publishedDate || null, x.expiryDate || null, x.isPinned, x.authorName]
    );
    res.status(201).json((await getNotices()).find((notice) => notice.id === rows[0].id));
  } catch (error) { next(error); }
});
router.put('/notices/:id', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(noticeSchema, req.body);
    const { rowCount } = await pool.query(
      `UPDATE notices SET title=$2,content=$3,category=$4,priority=$5,target_audience=$6,published_date=COALESCE($7::date,published_date),
       expiry_date=$8,is_pinned=$9,author_name=$10 WHERE id=$1`,
      [req.params.id, x.title, x.content, x.category, x.priority, x.targetAudience, x.publishedDate || null, x.expiryDate || null, x.isPinned, x.authorName]
    );
    if (!rowCount) return res.status(404).json({ error: 'Notice not found.' });
    res.json((await getNotices()).find((notice) => notice.id === req.params.id));
  } catch (error) { next(error); }
});
router.delete('/notices/:id', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM notices WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Notice not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});
router.patch('/notices/:id/pin', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE notices SET is_pinned=NOT is_pinned WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Notice not found.' });
    res.json((await getNotices()).find((notice) => notice.id === req.params.id));
  } catch (error) { next(error); }
});

router.get('/settings', async (_req, res, next) => {
  try { res.json(await getSettings()); } catch (error) { next(error); }
});
router.put('/settings', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(settingsSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO school_settings (id,school_name,motto,established_year,principal_name,email,phone,address,website,academic_year,currency_symbol,grading_scale)
       VALUES (TRUE,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       ON CONFLICT (id) DO UPDATE SET school_name=EXCLUDED.school_name,motto=EXCLUDED.motto,established_year=EXCLUDED.established_year,
       principal_name=EXCLUDED.principal_name,email=EXCLUDED.email,phone=EXCLUDED.phone,address=EXCLUDED.address,website=EXCLUDED.website,
       academic_year=EXCLUDED.academic_year,currency_symbol=EXCLUDED.currency_symbol,grading_scale=EXCLUDED.grading_scale
       RETURNING school_name AS "schoolName",motto,established_year AS "establishedYear",principal_name AS "principalName",email,phone,address,website,
       academic_year AS "academicYear",currency_symbol AS "currencySymbol",grading_scale AS "gradingScale"`,
      [x.schoolName, x.motto, x.establishedYear, x.principalName, x.email, x.phone, x.address, x.website, x.academicYear, x.currencySymbol, JSON.stringify(x.gradingScale)]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
});

export default router;
