const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// DATABASE SETUP
mongoose.connect("DATABASE URL", {useNewUrlParser: true});

// SCHEMA SETUP
const itemsSchema = {
  name: String
};

// MODEL SETUP
const Item = mongoose.model("Item", itemsSchema);


// MAKING A STARTING ARRAY OF TODO LIST ITEMS
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


// SCHEMA AND MODEL FOR CUSTOM URL TODO LISTS
const listSchema = {
  name: String,
  // ITEMS KEY USES THE ITEMS SCHEMA FOR A VALUE, SO IT CAN CONTAIN
  // ITEM OBJECTS INSIDE WHICH WE CAN DISPLAY THEN AS TODO LIST OBJECTS
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


// GET ROUTES
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    // PASS THE STARTING ARRAY TO DATABASE IF IT IS EMPTY
    if(foundItems.length === 0) {
      //INSERT
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted the documents");
        }
      });
      // REDIRECT AFTER ADDING THE STARTING ITEMS SO BROWSER DOESN'T HANG
      res.redirect("/");
    } else {
      // IF DATABASE IS NOT EMPTY JUST RENDER IT
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

// GET ROUTE FOR ANY URL ENTERED AFTER LOCALHOST/
app.get("/:customRouteName", function(req,res) {
  const customListName = _.capitalize(req.params.customRouteName);

  // FIND A COLLECTION WITH THE URL ENTERED
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if(!foundList) {
        // IF COLLECTION DOES NOT EXIST YET, CREATE NEW
        const list = new List({
          name: customListName,
          items:defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        // IF COLLECTION EXISTS, SHOW THE LIST
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });
});

// POST ROUTES
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// DELETING A TODO ITEM FROM DATABASE WITH THE VALUE OF CHECKBOX IN LIST.EJS
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findOneAndDelete({_id: checkedItemId}, function(err) {
      if (!err) {
        console.log("Successfully deleted the item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
