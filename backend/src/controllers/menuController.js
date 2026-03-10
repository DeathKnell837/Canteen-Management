const menuService = require('../services/menuService');
const { asyncHandler } = require('../utils/errorHandler');

const menuController = {
  getCategories: asyncHandler(async (req, res) => {
    const categories = await menuService.getCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  }),

  getItems: asyncHandler(async (req, res) => {
    const { categoryId } = req.query;

    const items = await menuService.getItems(categoryId ? parseInt(categoryId) : null);

    res.status(200).json({
      success: true,
      data: items
    });
  }),

  getItemDetail: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await menuService.getItemById(parseInt(itemId));

    res.status(200).json({
      success: true,
      data: item
    });
  }),

  searchItems: asyncHandler(async (req, res) => {
    const { q } = req.query;

    const items = await menuService.searchItems(q);

    res.status(200).json({
      success: true,
      data: items
    });
  }),

  createItem: asyncHandler(async (req, res) => {
    const { categoryId, name, description, price, isVegetarian, prepTime } = req.body;

    const item = await menuService.createItem(
      categoryId,
      name,
      description,
      price,
      isVegetarian,
      prepTime
    );

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  }),

  updateItem: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await menuService.updateItem(parseInt(itemId), req.body);

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  }),

  deleteItem: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    await menuService.deleteItem(parseInt(itemId));

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  }),

  uploadImage: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No image file provided' } });
    }

    const imageUrl = `/uploads/menu/${req.file.filename}`;
    const item = await menuService.updateItem(parseInt(itemId), { image_url: imageUrl });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: item
    });
  })
};

module.exports = menuController;
