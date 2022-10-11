var Item = require('../models/item');
var Category = require('../models/category');
var async = require('async');
var { body, validationResult } = require('express-validator');

exports.index = function(req, res) {
  async.parallel({
    item_count(callback) {
      Item.countDocuments({}, callback);
    },
    category_count(callback) {
      Category.countDocuments({}, callback);
    }
  }, function(err, results) {
    res.render('index', {title: 'KeyB Home Page', error: err, data: results})
  })
}

// Display list of all items
exports.item_list = function(req, res, next) {
  Item.find({}, 'name price')
    .sort({name: 1})
    .exec(function (err, list_items) {
      if (err) {return next(err); }
      // Successful, so render
      res.render('item_list', {title: 'Item List', item_list: list_items});
    })
  }


exports.item_detail = function(req, res, next) {
  Item.findById(req.params.id)
    .populate('category')
    .exec((err, results) => {
      if (err) {return next(err);}
      if (results==null) {
        var err = new Error('Item not found');
        err.status = 404;
        return next(err);
      }
      res.render('item_detail', {
        item: results
      });
    });
}

// Display Item create form on GET
exports.item_create_get = function(req, res) {
  Category.find((err, results) => {
    if (err) {
      return next(err);
    }
    res.render('item_form', {title: 'Create Item', categories: results});
  })
}

// Handle Item create on POST
exports.item_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = 
        typeof req.body.category === 'undefined' ? [] : [req.body.category];
    }
    next();
  },

  body('name', 'Item name required').trim().isLength({min:1}),
  body('imgUrl').trim(),
  body('price').isFloat().escape().withMessage('Price must be a number'),
  body('category.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      imgUrl: req.body.imgUrl,
      price: req.body.price,
      category: req.body.category
    });

    if (!errors.isEmpty()) {
      Category.find((err, results) => {
        if (err) {
          return next(err);
        }

        for (var category of results) {
          if (item.category.includes(category._id)) {
            category.checked = 'true';
          }
        }

        res.render('item_form', {
          title: 'Create Item',
          item,
          categories: results,
          errors: errors.array(),
        });
      })
      return;
    }

    item.save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect(item.url);
    })
  }
]

exports.item_delete_get = function(req, res, next) {
  Item.findById(req.params.id).exec(function(err, results) {
    if (err) { return next(err); }
    if (results==null) {
      res.redirect('/catalog/item');
    }
    res.render('item_delete', {title: 'Item', item: results})
  })
}

exports.item_delete_post = function(req, res, next) {
  Item.findByIdAndRemove(req.params.id, function(err) {
    if (err) { return next(err); }
    res.redirect('/catalog/item')
  })
}

exports.item_update_get = function(req, res, next) {
  async.parallel(
    {
      item(callback) {
        Item.findById(req.params.id)
          .exec(callback);
      },
      categories(callback) {
        Category.find(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        var err = new Error('Item not found')
        err.status = 404;
        return next(err);
      }

      for (var category of results.categories) {
        if (results.item.category.includes(category._id)) {
          category.checked = 'true';
        }
      }

      res.render('item_form', {
        title: 'Update Item',
        categories: results.categories,
        item: results.item
      });
    }
  )
}

exports.item_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = typeof req.body.category === 'undefined' ? [] : [req.body.category];
    }
    next();
  },

  body('name', 'Item name required').trim().isLength({min:1}),
  body('imgUrl').trim(),
  body('price').isFloat().escape().withMessage('Price must be a number'),
  body('category.*').escape(),

  (req, res, next) => {
    var errors = validationResult(req);

    var item = new Item({
      name: req.body.name,
      imgUrl: req.body.imgUrl,
      price: req.body.price,
      category: req.body.category,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      Category.find((err, resutls) => {
        if (err) {
          return next(err);
        }

        for (var category of results) {
          if (item.category.includes(category._id)) {
            category.checked = 'true';
          }
        }

        res.render('item_form', {
          title: 'Update Item', 
          item, 
          categories: results,
          errors: errors.array() });
      });
      return;
    } 
  
    Item.findByIdAndUpdate(req.params.id, item, {}, function(err, results) {
      if (err) { return next(err); }

      res.redirect(results.url)
    });
  }
]

// API Routes

exports.api_items_list_get = function(req, res, next) {
  Item.find()
    .populate('category')
    .exec(function(err, results) {
      if (err) { return next(err); }

      res.json(results);
    })
}

exports.api_item_detail_get = function(req, res, next) {
  Item.findById(req.params.id)
    .exec(function(err, results) {
      if (err) { return next(err); }

      res.json(results);
    })
}

exports.api_items_post = function(req, res, next) {
  res.json({message: 'NOT IMPLEMENTED YET: Create item'});
}

exports.api_items_put = function(req, res, next) {
  res.json({message: 'NOT IMPLEMENTED YET: Update item'});
}

exports.api_items_delete = function (req, res, next) {
  res.json({message: 'NOT IMPLEMENETED YET: Delete item'})
}