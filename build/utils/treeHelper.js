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
;
module.exports = TreeHelper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZUhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy90cmVlSGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtCQUFrQixJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUk7SUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLElBQUksT0FBTztVQUN6QixFQUFFO1VBQ0YsRUFBRSxDQUFDO0lBQ1QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUFBLENBQUM7QUFFRixRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxVQUFTLElBQUksRUFBRSxJQUFJO0lBQzdDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLENBQUEsQ0FBQztRQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ1osSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ2hDLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3hDLElBQUksS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hELEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUN2QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDbEIs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