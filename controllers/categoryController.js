var Category = require('../models/category');
var Item = require('../models/item');
var { body, validation, validationResult } = require('express-validator');
var async = require('async');
const category = require('../models/category');

exports.category_list = function(req, res, next) {
  Category.find({})
    .sort({name: 1})
    .exec(function(err, results) {
      if (err) { return next(err); }
      res.render('category_list', {title: 'Category List', category_list: results})
    })
}

exports.category_detail = function(req, res, next) {
  async.parallel(
    {
      category(callback) {
        Category.findById(req.params.id).exec(callback);
      },
      items(callback) {
        Item.find({category: req.params.id}).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.category == null) {
        var err = new Error('Category not found');
        err.status = 404;
        return next(err);
      }

      res.render('category_detail', {
        title: 'Category Detail',
        category: results.category,
        items: results.items
      })
    }
  )
}

exports.category_create_get = function(req, res) {
  res.render('category_form', {title: 'Create Category'});
}

exports.category_create_post = [
  body('name', 'Category name required').trim().isLength({min: 1}).escape(),

  (req, res, next) => {
    var errors = validationResult(req);

    var category = new Category ({
      name: req.body.name
    });

    if (!errors.isEmpty()) {
      res.render('category_form', {
        title: 'Create Category', 
        category: category, 
        errors: errors.array()
      });
      return;
    }
    else {
      category.save((err) => {
        if (err) {
          return next(err);
        }
        
        res.redirect(category.url);
      })
    }
  }
]

exports.category_delete_get = function(req, res, next) {
  async.parallel(
    {
      category(callback) {
        Category.findById(req.params.id).exec(callback);
      },
      items(callback) {
        Item.find({category: req.params.id}).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.category == null) {
        res.redirect('/catalog/category');
      }

      res.render('category_delete', {
        title: 'Delete Category',
        category: results.category,
        items: results.items
      });
    }
  );
}

exports.category_delete_post = function(req, res, next) {
  async.parallel(
    {
      category(callback) {
        Category.findById(req.params.id).exec(callback);
      },
      items(callback) {
        Item.find({category: req.params.id}).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.items.length > 0) {
        res.render('category_delete', {
          title: 'Delete Category',
          category: results.category,
          items: results.item
        });
        return;
      }
      Category.findByIdAndRemove(req.params.id, 
        (err, results) => {
          if (err) {
            return next(err);
          }
          res.redirect('/catalog/category');
        }
      );
    }
  );
}

exports.category_update_get = function(req, res, next) {
  Category.findById(req.params.id)
    .exec((err, results) => {
      if (err) { return next(err); }

      res.render('category_form', {title: 'Update Category', category: results});
    })
}

exports.category_update_post = [
  body('name', 'Category name required').trim().isLength({min: 1}).escape(),

  (req, res, next) => {
    var errors = validationResult(req);

    var category = new Category({
      name: req.body.name,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      res.render('category_form', {
        title: 'Update Category', 
        category
      })
    }

    Category.findByIdAndUpdate(req.params.id, category, {}, function(err, results) {
      if (err) { return next(err); }

      res.redirect(results.url);
    });
  }
]

// API routes

exports.api_category_list_get = function(req, res, next) {
  Category.find()
    .exec(function(err, results) {
      if (err) { return next(err); }
      
      return res.json(results);
    })
}

exports.api_category_detail_get = function(req, res, next) {
  async.parallel(
    {
      category(callback) {
        Category.findById(req.params.id).exec(callback);
      },
      items(callback) {
        Item.find({category: req.params.id}).exec(callback);
      }
    },
    (err, results) => {
      if (err) { return next(err); }
      var json = {
        category: [results.category],
        items: results.items
      }
      res.json(json);
    }
  )
}

exports.api_category_post = function(req, res) {
  res.json({message: 'NOT IMPLEMENTED YET: Create item'});
}

exports.api_category_put = function(req, res) {
  res.json({message: 'NOT IMPLEMENTED YET: Update item'});
}

exports.api_category_delete = function(req, res) {
  res.json({message: 'NOT IMPLEMENTED YET: List of items'});
}