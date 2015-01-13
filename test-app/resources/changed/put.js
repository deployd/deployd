if(this.name === '$NO_CHANGE') {
    if(changed('name')) {
        this.name = 'saw name change';
    }
}

if (changed('data')) {
    this.data.changed = true;
}