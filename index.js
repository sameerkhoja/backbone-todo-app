//so the first thing we want to is define an object
// which we will place all of our backbone classes as well as instances.
var app = {};

//now we will define our backbone model, which will
// just be the todo title and a boolean for completed - pretty simple
//defaults will fill in default attibutes in case we do not define them.
app.Todo = Backbone.Model.extend({
  defaults: {
    title: '',
    completed: false
  },
  toggle: function() {
    this.save({completed: !this.get('completed')});
  }
});
//by doing todo.set({foo: "bar"}), we can easily add
// more stuff to the todo as we please.

//now we define our backbone collection,
// which will hold all of our todo models
//our model is app.Todo
//we will store the todos in local storage, which is a
// thing backbone provides to persist your data.
app.TodoList = Backbone.Collection.extend({
  model: app.Todo,
  localStorage: new Store('backbone-todo'),
  completed: function() {
    return this.filter(function(todo) {
      return todo.get('completed');
    });
  },
  remaining: function() {
      return this.without.apply(this, this.completed());
  }
});

//let's create an instance of app.TodoList in app
app.todoList = new app.TodoList();

// now we move on to the view. backbone views have 4 basic properties:
// el, initialize, render, and events.
// el - defines the DOM element that the view is referencing. you can define this with el, tagName, className, id, or attributes
// initialize - can pass parameters on initialization
// render - injects markup into elements
// events - written in the format {"<EVENT_TYPE> <ELEMENT_ID>": "<CALLBACK_FUNTION>"}


//View for a Todo item
//needs a model parameter, so we will give it the todo model when we instantiate.
app.TodoView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#item-template').html()),
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.input = this.$('.edit');
    return this;
  },
  initialize: function() {
    this.model.on('change', this.render, this);
    this.model.on('destroy', this.remove, this); //convenience method that backbone has to remove the view from the DOM.
  },
  events: {
    'dblclick label' : 'edit',
    'keypress .edit' : 'updateOnEnter',
    'blur .edit' : 'close',
    'click .toggle' : 'toggle',
    'click .destroy': 'destroy'
  },
  edit: function() {
    this.$el.addClass('editing');
    this.input.focus();
  },
  close: function() {
    var newInput = this.input.val().trim();
    if(newInput) {
      this.model.save({title: newInput});
    }
    this.$el.removeClass('editing');
  },
  updateOnEnter: function(e) {
    if(e.which == 13) this.close();
  },
  toggle: function() {
    this.model.toggle();
  },
  destroy: function() {
    this.model.destroy();
  }
});

// example of TodoView instantiation:
// var todoView = new app.TodoView({model: app.Todo});

//View for the entire app - takes the collection of todos and renders based on the TodoView
app.AppView = Backbone.View.extend({
  el: '#todoapp',
  initialize: function() {
    this.input = this.$('#new-todo');
    app.todoList.on('add', this.addOne, this);
    app.todoList.on('reset', this.addAll, this);
    app.todoList.fetch(); //loads list from local storage
  },
  events: {
    'keypress #new-todo': 'createTodoOnEnter'
  },
  createTodoOnEnter: function(e) {
    if(e.which !== 13 || !this.input.val().trim()) return;
    app.todoList.create(this.newAttributes()); //triggers 'add' event, which calls addOne
    this.input.val(''); //clears input

  },
  addOne: function(todo) {
    var todoView = new app.TodoView({model: todo});
    this.$('#todo-list').append(todoView.render().el);
  },
  addAll: function() {
    this.$('#todo-list').html(''); //clear list
    //filter todo item list
    switch (window.filter) {
      case 'pending':
        _.each(app.todoList.remaining(), this.addOne)
        break;
      case 'completed':
        _.each(app.todoList.completed(), this.addOne)
        break;
      default:
        app.todoList.each(this.addOne, this);
        break;
    }
  },
  newAttributes: function() {
    return {
      title: this.input.val().trim(),
      completed: false
    }
  }
});

app.Router = Backbone.Router.extend({
  routes: {
    '*filter' : 'setFilter'
  },
  setFilter: function(params) {
    console.log('app.router.params = ' + params);
    window.filter = params.trim() || '';
    app.todoList.trigger('reset');
  }
});

app.router = new app.Router();
Backbone.history.start();
app.appView = new app.AppView();
