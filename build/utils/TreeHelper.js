"use strict";
function TreeNode(kind, parent, data) {
    this.children = kind == 'array'
        ? []
        : {};
    this.parent = parent;
    this.data = data;
    this.childCount = 0;
}
;
TreeNode.prototype.addChild = function (name, data) {
    if (this.kind == 'array') {
        data = name;
        name = this.children.length;
    }
    ;
    data = data || this.root.initTreeNode();
    var child = new TreeNode(this.kind, this, data);
    child.id = name;
    child.path = this.path.concat([name]);
    child.root = this.root;
    this.childCount++;
    this.children[name] = child;
    return child;
};
TreeNode.prototype.getParents = function () {
    var res = [];
    var node = this;
    while (true) {
        node = node.parent;
        if (!node) {
            return res;
        }
        ;
        res.push(node);
    }
    ;
};
TreeNode.prototype.childIterate = function (fn) {
    for (var i in this.children) {
        fn.call(this, this.children[i], i);
    }
    ;
};
TreeNode.prototype.getChildArr = function () {
    if (this.kind == 'array') {
        return this.children;
    }
    ;
    var res = [];
    this.childIterate(function (child) {
        res.push(child);
    });
    return res;
};
TreeNode.prototype.getDeepChildArr = function () {
    var res = this.getChildArr();
    this.childIterate(function (child) {
        res = res.concat(child.getDeepChildArr());
    });
    return res;
};
TreeNode.prototype.remove = function (path) {
    var leafKey = path[path.length - 1];
    var branchPath = path.slice(0, -1);
    var branch = this.byPath(branchPath);
    branch.childCount--;
    var res = branch.children[leafKey];
    delete branch.children[leafKey];
    return res;
};
TreeNode.prototype.byPath = function (path) {
    if (path.length == 0) {
        return this;
    }
    ;
    var node = this;
    while (true) {
        var key = path[0];
        node = node.children[key];
        if (!node) {
            return null;
        }
        ;
        path = path.slice(1);
        if (path.length == 0) {
            return node;
        }
        ;
    }
    ;
};
TreeNode.prototype.access = function (path) {
    if (path.length == 0) {
        return this;
    }
    ;
    var node = this;
    while (true) {
        var key = path[0];
        var parent = node;
        node = node.children[key];
        if (!node) {
            var data = this.root.initTreeNode();
            node = parent.addChild(key, data);
            parent.children[key] = node;
        }
        ;
        path = path.slice(1);
        if (path.length == 0) {
            return node;
        }
        ;
    }
    ;
};
function TreeHelper(opts, rootData) {
    opts = opts || {};
    opts.kind = opts.kind || 'array';
    var initTreeNode = opts.initTreeNode || function () {
        return {};
    };
    var data = rootData || initTreeNode();
    var rootTreeNode = new TreeNode(opts.kind, null, data);
    rootTreeNode.isRoot = true;
    rootTreeNode.root = rootTreeNode;
    rootTreeNode.path = [];
    rootTreeNode.initTreeNode = initTreeNode;
    return rootTreeNode;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TreeHelper;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJlZUhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9UcmVlSGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQkFBa0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJO0lBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxJQUFJLE9BQU87VUFDekIsRUFBRTtVQUNGLEVBQUUsQ0FBQztJQUNULElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLENBQUM7QUFBQSxDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBUyxJQUFJLEVBQUUsSUFBSTtJQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxDQUFBLENBQUM7UUFDdEIsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNaLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBQUEsQ0FBQztJQUNGLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QyxJQUFJLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRCxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztJQUNoQixLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0QyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDdkIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2xC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