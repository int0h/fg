function Node(kind, parent, data){
    this.children = kind == 'array'
        ? []
        : {};   
    this.parent = parent;
    this.data = data;
    this.childCount = 0;
};

Node.prototype.addChild = function(name, data){
    if (this.kind == 'array'){
        data = name;
        name = this.children.length;
    };
    data = data || this.root.initNode();
    var child = new Node(this.kind, this, data);
    child.id = name;
    child.path = this.path.concat([name]);
    child.root = this.root;
    this.childCount++;
    this.children[name] = child;
    return child;
};

Node.prototype.getParents = function(){
    var res = [];    
    var node = this;
    while (true){
        node = node.parent;
        if (!node){
            return res;
        };
        res.push(node);
    };  
};

Node.prototype.childIterate = function(fn){
    for (var i in this.children){
        fn.call(this, this.children[i], i);  
    };
};

Node.prototype.getChildArr = function(){
    if (this.kind == 'array'){
        return this.children;
    };
    var res = [];
    this.childIterate(function(child){
        res.push(child);
    });            
    return res;
};

Node.prototype.getDeepChildArr = function(){
    var res = this.getChildArr();
    this.childIterate(function(child){
       res = res.concat(child.getDeepChildArr());
    });
    return res;
};

Node.prototype.remove = function(path){
    var leafKey = path[path.length - 1];
    var branchPath = path.slice(0, -1);
    var branch = this.byPath(branchPath);
    branch.childCount--;
    var res = branch.children[leafKey];
    delete branch.children[leafKey];   
    return res; 
};

Node.prototype.byPath = function(path){    
    if (path.length == 0){
        return this;
    };
    var node = this;
    while (true){
        var key = path[0];
        node = node.children[key];
        if (!node){
            return null;
        };
        path = path.slice(1);
        if (path.length == 0){
            return node;  
        };
    };
};

Node.prototype.access = function(path){
    if (path.length == 0){
        return this;
    };
    var node = this;
    while (true){
        var key = path[0];
        var parent = node;
        node = node.children[key];
        if (!node){
            var data = this.root.initNode();                
            node = parent.addChild(key, data);
            parent.children[key] = node;
        };
        path = path.slice(1);
        if (path.length == 0){
            return node;  
        };
    }; 
};

function TreeHelper(opts, rootData){
    opts = opts || {};
    opts.kind = opts.kind || 'array';
    var initNode = opts.initNode || function(){
        return {};
    };
    var data = rootData || initNode();
    var rootNode = new Node(opts.kind, null, data);
    rootNode.isRoot = true;
    rootNode.root = rootNode;
    rootNode.path = [];
    rootNode.initNode = initNode;
    return rootNode;
};

module.exports = TreeHelper;