function TreeNode(kind, parent, data){
    this.children = kind == 'array'
        ? []
        : {};   
    this.parent = parent;
    this.data = data;
    this.childCount = 0;
};

TreeNode.prototype.addChild = function(name, data){
    if (this.kind == 'array'){
        data = name;
        name = this.children.length;
    };
    data = data || this.root.initTreeNode();
    var child = new TreeNode(this.kind, this, data);
    child.id = name;
    child.path = this.path.concat([name]);
    child.root = this.root;
    this.childCount++;
    this.children[name] = child;
    return child;
};

TreeNode.prototype.getParents = function(){
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

TreeNode.prototype.childIterate = function(fn){
    for (var i in this.children){
        fn.call(this, this.children[i], i);  
    };
};

TreeNode.prototype.getChildArr = function(){
    if (this.kind == 'array'){
        return this.children;
    };
    var res = [];
    this.childIterate(function(child){
        res.push(child);
    });            
    return res;
};

TreeNode.prototype.getDeepChildArr = function(){
    var res = this.getChildArr();
    this.childIterate(function(child){
       res = res.concat(child.getDeepChildArr());
    });
    return res;
};

TreeNode.prototype.remove = function(path){
    var leafKey = path[path.length - 1];
    var branchPath = path.slice(0, -1);
    var branch = this.byPath(branchPath);
    branch.childCount--;
    var res = branch.children[leafKey];
    delete branch.children[leafKey];   
    return res; 
};

TreeNode.prototype.byPath = function(path){    
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

TreeNode.prototype.access = function(path){
    if (path.length == 0){
        return this;
    };
    var node = this;
    while (true){
        var key = path[0];
        var parent = node;
        node = node.children[key];
        if (!node){
            var data = this.root.initTreeNode();                
            node = parent.addChild(key, data);
            parent.children[key] = node;
        };
        path = path.slice(1);
        if (path.length == 0){
            return node;  
        };
    }; 
};

export default function TreeHelper(opts, rootData){
    opts = opts || {};
    opts.kind = opts.kind || 'array';
    var initTreeNode = opts.initTreeNode || function(){
        return {};
    };
    var data = rootData || initTreeNode();
    var rootTreeNode = new TreeNode(opts.kind, null, data);
    rootTreeNode.isRoot = true;
    rootTreeNode.root = rootTreeNode;
    rootTreeNode.path = [];
    rootTreeNode.initTreeNode = initTreeNode;
    return rootTreeNode;
};