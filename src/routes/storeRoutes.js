const express = require('express');
const router = express.Router();
const StoreModel = require('../models/storeModel');

// Tüm mağazaları getir
router.get('/', async (req, res) => {
  try {
    const stores = await StoreModel.getAll();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ID ile mağaza getir
router.get('/:id', async (req, res) => {
  try {
    const store = await StoreModel.getById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Mağaza bulunamadı' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni mağaza ekle
router.post('/', async (req, res) => {
  try {
    const newStore = await StoreModel.create(req.body);
    res.status(201).json(newStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mağaza güncelle
router.put('/:id', async (req, res) => {
  try {
    const updatedStore = await StoreModel.update(req.params.id, req.body);
    if (!updatedStore) {
      return res.status(404).json({ error: 'Mağaza bulunamadı' });
    }
    res.json(updatedStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mağaza sil
router.delete('/:id', async (req, res) => {
  try {
    await StoreModel.delete(req.params.id);
    res.json({ message: 'Mağaza başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;