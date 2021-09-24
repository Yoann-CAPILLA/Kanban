const List = require('./list');
const Card = require('./card');
const Label = require('./label');

List.hasMany(Card, {
    foreignKey: 'list_id',
    as: 'cards'
});

Card.belongsTo(List, {
    foreignKey: 'list_id',
    as: 'list'
});

Card.belongsToMany(Label, {
    foreignKey: 'card_id',
    otherKey: 'label_id',
    as: 'labels',
    through: 'card_has_label'
});

Label.belongsToMany(Card, {
    foreignKey: 'label_id',
    otherKey: 'card_id',
    as: 'cards',
    through: 'card_has_label'
});

module.exports = {
    List,
    Card,
    Label
};