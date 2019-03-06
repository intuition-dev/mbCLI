var Example1Service = (function () {
    function Example1Service() {
        this.entityName = 'table_one2';
    }
    Example1Service.prototype.read = function (id) {
        var _this = this;
        console.info('--reading...', Date.now() - _start);
        var ref = db1.collection(this.entityName);
        if (id) {
            return db1.collection(this.entityName).doc(id)
                .get()
                .then(function (docSnap) {
                var temp = docSnap.data();
                temp['id'] = docSnap.id;
                return temp;
            })
                .catch(function (error) {
                console.info("Error getting documents: ", error);
            });
        }
        return ref
            .get()
            .then(function (querySnapshot) {
            var rows = [];
            querySnapshot.forEach(function (doc) {
                var row = doc.data();
                row['id'] = doc.id;
                rows.push(row);
            });
            return rows;
        })
            .catch(function (error) {
            console.info("Error getting documents: ", error);
        });
    };
    Example1Service.prototype.add = function (row) {
        if (row.id)
            delete row.id;
        var newPK = db1.collection(this.entityName).doc();
        return newPK.set(row)
            .then(function () {
            console.info('successful');
        })
            .catch(function (error) {
            console.error('oops', error);
        });
    };
    Example1Service.prototype.update = function (row) {
        console.info(row);
        var id = row['id'];
        console.info(id, row);
        delete row.id;
        var ref = db1.collection(this.entityName).doc(id);
        return ref.set(row)
            .then(function () {
            console.info('successful');
            return id;
        })
            .catch(function (error) {
            console.error('oops', error);
        });
    };
    Example1Service.prototype.delete = function (row) {
        var id = row['id'];
        var ref = db1.collection(this.entityName).doc(id);
        return ref.delete()
            .then(function () {
            console.info('successfully deleted');
        })
            .catch(function (error) {
            console.error('oops', error);
        });
    };
    Example1Service.prototype.valid = function (row) {
        var col1 = row['col1'];
        var col2 = row['col2'];
        if (validator.isEmpty(col1, { ignore_whitespace: true }))
            return 'Col1 is blank';
        if (validator.isEmpty(col2, { ignore_whitespace: true }))
            return 'Col2 is blank';
        return 'OK';
    };
    return Example1Service;
}());