'use strict';

let input = document.querySelector(".add-task__input");
let taskList = document.querySelector('.main__task-list');
let alertTimeoutID;
let basketCounter = 0;
let basketObserver = new MutationObserver(activateBasket);
let clickCounter = 0; //for double click polyfill;

basketObserver.observe(document.querySelector(".basket-form__basket"), {childList: true});

document.querySelector(".add-task__button").addEventListener('click', addTask);
document.querySelector(".footer__basket-button").addEventListener('click', toggleBasketVisibility);
document.querySelector(".basket-form__close-button").addEventListener('click', toggleBasketVisibility);
document.querySelector(".basket-buttons__restore-button").addEventListener('click', returnTask);
document.querySelector(".basket-buttons__clean-button").addEventListener('click', removeTask);
document.querySelector(".footer__basket-button").addEventListener('contextmenu', showBasketMenu);
document.addEventListener('keydown', (event) => {
    if (document.activeElement === input && event.keyCode === 13) addTask(); //Enter
    if (event.keyCode === 27) event.preventDefault(); //Escape
});
document.addEventListener('click', checkAllTasks);
document.addEventListener("click", throwTask);
document.addEventListener('click', noticeTaskDone);
document.addEventListener('pointerdown', moveTask);
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('click', modifyTask);
window.addEventListener('load', fillTaskList);
window.addEventListener('unload', saveTaskList);
 
function createTask(value) {
    let block = document.querySelector(".task-list__block-template").content.cloneNode(true);
    block.querySelector(".task-container__task").textContent = value;
    taskList.append(block);
}

function addTask() {
    if (!input.value.length) {
        createAlert("Add new task!", "error");
    } else if (checkDuplicateTask(input.value).any){
        alertDuplicateTask(input.value);
    } else {
        createTask(input.value);
    }
    input.value = '';
    input.focus();
}

function throwTask(event){
    if (!event.target.closest('.task-block__del-button')) return;
    
    let basketElement= document.querySelector(".basket__template").content.cloneNode(true);
    
    basketElement.querySelector(".basket__label")
        .append(event.target.closest(".task-block").querySelector(".task-container__task").textContent);
    document.querySelector('.basket-form__basket').prepend(basketElement);
    
    event.target.closest('.task-block').remove();
}

function noticeTaskDone(event) {
    let checkButton = event.target.closest(".task-block__check-button");
    if (!checkButton) return;
    
    let block = event.target.closest(".task-block");
    
    block.classList.toggle('task-done');
    [checkButton.children[0].hidden, checkButton.children[1].hidden] = 
        [checkButton.children[1].hidden, checkButton.children[0].hidden];
    
    let color = checkButton.children[0].hidden ? '#ffffff' : "#ebebeb";
    
    checkButton.style.borderColor = color;
    block.querySelector(".task-block__mover").style.borderColor = color;
    block.querySelector(".fa-arrows-up-down").style.color = color;
}

function moveTask(event) {
    if (!event.target.closest('.task-block__mover')) return;
    if (document.querySelectorAll(".task-block").length < 2) return;

    let movedBlock = event.target.closest(".task-block");
    let pointerSeparator = document.createElement('div');
        pointerSeparator.classList.add('task-list__pointer-separator');
    let shiftX = event.clientX - getCord(movedBlock, 'left');
    let onScrollInterval;
    
    takeTask();

    document.addEventListener('pointermove', shiftTask);
    document.addEventListener('pointerup', putTask);
    document.addEventListener('contextmenu', putTask);
    document.addEventListener('pointercancel', putTask);

    function takeTask() {
        movedBlock.before(pointerSeparator);
        movedBlock.classList.add("task-block_move-state");
        taskList.after(movedBlock);
        moveTo(event.clientX, event.clientY);
    }

    function moveTo(oX, oY) {
        let left = oX - shiftX;
        let top = oY - movedBlock.offsetHeight / 2;

        //Restriction of leaving the screen
        left = Math.max(left, 0);
        left = Math.min(left, document.documentElement.clientWidth - movedBlock.offsetWidth);
        top = Math.max(top, 0);
        top = Math.min(top, document.documentElement.clientHeight - movedBlock.offsetHeight);

        movedBlock.style.top = top + 'px';
        movedBlock.style.left = left + 'px';
    }

    function getCord(elem, cord) {
        return elem.getBoundingClientRect()[cord];
    }

    function shiftTask(event) {
        event.preventDefault();
        moveTo(event.clientX, event.clientY);
        
        clearInterval(onScrollInterval);
        scrolling();
        movePointer(event);
        onScrollInterval = setInterval(function (){
            scrolling();
            movePointer(event);
        }, 50);
    }
    
    function movePointer(event){
        let blockBefore = pointerSeparator.previousElementSibling || taskList.firstElementChild;
        let blockAfter = pointerSeparator.nextElementSibling || taskList.lastElementChild;

        //shift the pointer up
        if (pointerSeparator !== taskList.firstElementChild &&
            Math.max(event.clientY, getCord(taskList, "top")) < 
            getCord(blockBefore, "top") + blockBefore.offsetHeight / 2){
                taskList.insertBefore(pointerSeparator, blockBefore);
            }

        //shift the pointer down
        if (pointerSeparator !== taskList.lastElementChild &&
            Math.min(event.clientY, getCord(taskList, "bottom")) >
            getCord(blockAfter, "top") + blockAfter.offsetHeight / 2){
            taskList.insertBefore(blockAfter, pointerSeparator);
        }
    }

    function scrolling(){
        //Scrolling up
        if (getCord(movedBlock, "top") - getCord(taskList, "top") < movedBlock.offsetHeight / 2) {
            taskList.scrollTop = Math.max(0, taskList.scrollTop - movedBlock.offsetHeight / 8);
        }
        //Scrolling down
        if (getCord(taskList, "bottom") - getCord(movedBlock, 'bottom') < movedBlock.offsetHeight / 2){
            taskList.scrollTop = Math.min(
                taskList.scrollHeight - taskList.clientHeight,
                taskList.scrollTop + movedBlock.offsetHeight / 8);
        } 
    }
    
    function putTask() {
        if(!document.querySelector(".task-block_move-state")) return;
        
        document.removeEventListener("pointermove", shiftTask);
        document.removeEventListener("pointerup", putTask);
        document.removeEventListener("pointercancel", putTask);
        document.removeEventListener('contextmenu', putTask);
        
        clearInterval(onScrollInterval);
        movedBlock.classList.remove("task-block_move-state");
        pointerSeparator.replaceWith(movedBlock);
        movedBlock.style.removeProperty("top");
        movedBlock.style.removeProperty("left");
        taskList.scrollTop += Math.max(0, getCord(movedBlock, 'bottom') - getCord(taskList, "bottom"));
    }
}

function modifyTask(event) {
    let taskField = event.target.closest(".task-container__task");
    
    if (!taskField) return;
    
    clickCounter ++;
    setTimeout(() => clickCounter = 0, 500);
    if (clickCounter < 2) return;
    
    if (taskField.getAttribute("contentEditable")) return;
    
    let valueBefore = taskField.textContent;
    let okButton = document.createElement('button');
    
    okButton.innerHTML = `<i class="fa-solid fa-check fa-2xl" style="color: #00dd38;"></i>`;
    okButton.classList.add("task-block_button-style");
    
    taskField.contentEditable = true;
    taskField.after(okButton);
    taskField.focus();
    toggleModalWindow()
    
    document.getSelection().setBaseAndExtent(taskField, 0, taskField, taskField.childNodes.length);
    taskField.parentElement.classList.add('edited');
    
    document.addEventListener('click', cancelEditing);
    document.addEventListener('keydown', cancelEditing);
    document.addEventListener('keydown', applyEditing);
    okButton.addEventListener('click', applyEditing);
    
    function cancelEditing(event){
        if (!event.keyCode && 
            event.target.closest(".task-block__task-container") === taskField.parentElement) return;
        if (event.keyCode && event.keyCode !== 27) return;
        
        finishEditing(true)
    }
    
    function applyEditing(event){
        if (event.keyCode && event.keyCode !== 13) return;
        finishEditing();
    }
    
    function finishEditing(cancel = false){
        if (cancel) taskField.textContent = valueBefore;
        if (checkDuplicateTask(taskField.textContent).any){
            alertDuplicateTask(taskField.textContent);
            taskField.focus();
            return;
        }
        
        taskField.removeAttribute('contentEditable');
        okButton.remove();
        toggleModalWindow()
        taskField.parentElement.classList.remove('edited');

        document.removeEventListener('click', cancelEditing);
        document.removeEventListener('keydown', cancelEditing);
        document.removeEventListener('keydown', applyEditing);
        okButton.removeEventListener('click', applyEditing);
    }
}

function fillTaskList() {
    if (!!localStorage.getItem('taskList')) {
        for (let objectBlock of Object.values(JSON.parse(localStorage.getItem('taskList')))) {
            createTask(objectBlock.value);
            if (objectBlock.isDone) {
                taskList.lastElementChild.querySelector(".task-block__check-button").click();
            }
        }
    }
    
    if (!!localStorage.getItem('basket')) {
        for(let value of Object.values(JSON.parse(localStorage.getItem('basket'))).reverse()){
            createTask(value);
            taskList.lastElementChild.querySelector(".task-block__del-button").click();
        }
    }
}

function saveTaskList() {
    localStorage.clear();
    
    if (!!taskList.children.length) {
        localStorage.setItem('taskList', JSON.stringify(
            Object.assign(...Array.from({length: taskList.children.length},
                (_, i) => {
                    return {
                        [i]: {
                            value: taskList.children[i].querySelector(".task-container__task").textContent,
                            isDone: taskList.children[i++].classList.contains('task-done')
                        }
                    }
                }))
        ));
    } 
    
    if (!!document.querySelector(".basket-form__basket").children.length) {
        localStorage.setItem('basket', JSON.stringify(
            Object.assign(...Array.from({length: document.querySelector(".basket-form__basket").children.length},
                (_, i) => {
                    return {[i]: document.querySelector(".basket-form__basket").children[i++].lastChild.textContent}
                }))
        ));
    }
}

function createAlert(text, type) {
    let alert = document.querySelector(".header__alert");
    
    if (alert.textContent === text) return;
    if (alert.textContent) clearTimeout(alertTimeoutID);
    
    alert.classList.remove("error");
    alert.textContent = text;
    alert.classList.add(type);
    
    alertTimeoutID = setTimeout(() => {
        alert.textContent = "";
        alert.classList.remove(type);
    }, 3000);
}

function toggleBasketVisibility() {
    document.querySelector(".footer__basket-form").style.height = 
        document.querySelector('.footer').getBoundingClientRect().bottom -
        document.querySelector('.main').getBoundingClientRect().top +
        'px';
    
    document.querySelector(".header__caption").textContent =
        document.querySelector(".footer__basket-form").classList.contains("hidden") ?
            "Basket" : "To Do List" ;
    
    document.querySelector(".footer__basket-form").classList.toggle("hidden");
    document.querySelector('.main').classList.toggle('hidden');
    document.querySelector('.footer__basket-button').classList.toggle('hidden');
    
    document.querySelector('.basket-form__basket').scrollTop = 
        document.querySelector('.basket-form__basket').scrollHeight -
        document.querySelector('.basket-form__basket').offsetHeight;
    
}

function toggleModalWindow(){
    document.querySelector(".modal-window").classList.toggle('hidden');
}

function activateBasket(mutations) {
    basketCounter += getMutationLength(mutations, 'addedNodes') - 
        getMutationLength(mutations, 'removedNodes');
    
    document.querySelector(".footer__basket-button").disabled = !basketCounter;
    document.querySelector(".basket-button_inactive").classList.toggle("hidden", !!basketCounter);
    document.querySelector(".basket-button_active").classList.toggle("hidden", !basketCounter);
    document.querySelector(".basket-interface__all-checker").checked = false;
    
    function getMutationLength(mutations, parameter){
       return mutations
           .map(mutation => Array.from(mutation[parameter]))
           .flat()
           .filter(elem => elem instanceof HTMLElement)
           .length;
    }
}

function removeTask(){
    document.querySelectorAll(".basket__input:checked")
        .forEach(elem => elem.closest(".basket__label").remove());
    
    document.querySelector(".basket-interface__all-checker").checked = false;
    
    if (!document.querySelector('.basket-form__basket').children.length) {
        toggleBasketVisibility();
    }
}

function returnTask() {
    document.querySelectorAll(".basket__input:checked")
        .forEach(elem => createTask(elem
            .closest(".basket__label").lastChild.textContent));
    
    removeTask();
}

function checkAllTasks(event) {
    if (event.target.classList.contains("basket-interface__all-checker")) {
        document.querySelectorAll(".basket__input")
            .forEach(input => input.checked = event.target.checked);
    }
    
    if (event.target.classList.contains("basket__input")){
       document.querySelector(".basket-interface__all-checker").checked = 
           Array.from(document.querySelectorAll('.basket__input')).every(input => input.checked);
    }
}

function showBasketMenu(event) {
    event.preventDefault();
    
    let menu = document.querySelector(".footer__context-menu");
    
    toggleModalWindow()
    menu.classList.toggle("hidden");

    menu.style.top = event.clientY - menu.offsetHeight + 'px';
    menu.style.left = (event.clientX > document.body.getBoundingClientRect().right - menu.offsetWidth ?
    event.clientX - menu.offsetWidth : event.clientX) + 'px';
    
    document.querySelector(".list__item_restore").addEventListener("click", restoreTasks);
    document.querySelector(".list__item_cleanup").addEventListener("click", cleanupBasket);
    document.addEventListener("click", closeMenu);
    
    function restoreTasks() {
        document.querySelector('.basket-interface__all-checker').click();
        document.querySelector('.basket-buttons__restore-button').click();
        toggleBasketVisibility()
    }
    
    function cleanupBasket() {
        document.querySelector('.basket-interface__all-checker').click();
        document.querySelector('.basket-buttons__clean-button').click();
        toggleBasketVisibility()
    }
    
    function closeMenu(event) {
        if (event.target.closest('.footer__context-menu')) return;

        toggleModalWindow()
        menu.classList.toggle("hidden");
        document.querySelector(".list__item_restore").removeEventListener("click", restoreTasks);
        document.querySelector(".list__item_cleanup").removeEventListener("click", cleanupBasket);
        document.removeEventListener("click", closeMenu);
        menu.removeAttribute('style');
    }
}

function checkDuplicateTask(task) {
    let pool = {};
    pool.taskList = Array.from(document.querySelectorAll(".task-container__task:not([contentEditable])")
        ,elem => elem.textContent).includes(task);
    pool.basket = Array.from(document.querySelectorAll(".basket__label"),
            elem => elem.lastChild.textContent).includes(task);
    pool.any = pool.taskList || pool.basket;
    return pool;
}

function alertDuplicateTask(task) {
    if (checkDuplicateTask(task).taskList) {
        createAlert("You already have this task!", "error");
    } else if (checkDuplicateTask(task).basket) {
        createAlert("You already have this task! Restore from basket.", "error");
    }
}
