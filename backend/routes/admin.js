const express = require('express');
const auth = require('../utils/authMiddleware');
const Users = require('../models/user');
const Emergency = require('../models/emergency');
const Consult = require('../models/consult');
const Prescription = require('../models/prescription');
const Hospital = require('../models/hospital');
const Pharmacy = require('../models/pharmacy');
const router = express.Router();

router.use(auth(['admin']));

router.get('/users', async (req, res) => {
  res.json(await Users.all());
});

router.patch('/users/:id/role', async (req, res) => {
  await Users.updateRole(req.params.id, req.body.role);
  res.send({ success: true });
});

router.delete('/users/:id', async (req, res) => {
  await Users.delete(req.params.id);
  res.send({ success: true });
});

router.get('/emergencies', async (req, res) => {
  res.json(await Emergency.all());
});

router.patch('/emergencies/:id/status', async (req, res) => {
  await Emergency.updateStatus(req.params.id, req.body.status);
  res.send({ success: true });
});

router.get('/prescriptions', async (req, res) => {
  res.json(await Prescription.all());
});

router.get('/hospitals', async (req, res) => {
  res.json(await Hospital.all());
});

router.post('/hospitals', async (req, res) => {
  const [id] = await Hospital.create(req.body);
  res.json({ id });
});

router.put('/hospitals/:id', async (req, res) => {
  await Hospital.update(req.params.id, req.body);
  res.send({ success: true });
});

router.delete('/hospitals/:id', async (req, res) => {
  await Hospital.delete(req.params.id);
  res.send({ success: true });
});

router.get('/pharmacies', async (req, res) => {
  res.json(await Pharmacy.all());
});

router.post('/pharmacies', async (req, res) => {
  const [id] = await Pharmacy.create(req.body);
  res.json({ id });
});

router.put('/pharmacies/:id', async (req, res) => {
  await Pharmacy.update(req.params.id, req.body);
  res.send({ success: true });
});

router.delete('/pharmacies/:id', async (req, res) => {
  await Pharmacy.delete(req.params.id);
  res.send({ success: true });
});

router.get('/reports', async (req, res) => {
  const consults = await Consult.count();
  const emergencies = await Emergency.count();
  const prescriptions = await Prescription.count();
  res.json({ consults, emergencies, prescriptions });
});

module.exports = router;