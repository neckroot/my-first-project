let input = document.querySelector(".add-task__input");

document.querySelector(".add-task__button").addEventListener('click', addTask);
document.addEventListener('keydown', (event) => {
    if (document.activeElement === input && event.code === 'Enter') addTask();
    if (event.code === "Escape") event.preventDefault();
});
document.addEventListener("click", removeTask);
document.addEventListener('click', noticeTaskDone);
document.addEventListener('pointerdown', moveTask);
document.addEventListener('dblclick', modifyTask)

function createTask() {
    document.querySelector(".task-list")
        .insertAdjacentHTML(
            "beforeend"
            , `<div class="task-block">
                <div class="task-block__mover">
                    <i class="fa-solid fa-arrows-up-down fa-lg" style="color: #ebebeb;"></i>
                </div>
                <div class="task-block__task-container">
                    <div class="task-container__task">${input.value}</div>
                </div>
                <button class="task-block__check-button task-block_button-style" type="button">
                    <div class="check-button_unchecked">
                        <i class="fa-solid fa-square-check fa-xl" style="color: #ebebeb;"></i>
                    </div>
                    <div class="check-button_checked" hidden>
                        <i class="fa-solid fa-check fa-xl" style="color: #00dd38;"></i>
                    </div>
                </button>
                <button class="task-block__del-button task-block_button-style" type="button">
                    <i class="fa-solid fa-trash fa-lg" style="color: #ebebeb;"></i>
                </button>
            </div>
    `   );
}

function addTask() {
    if (!input.value.length) {
        alert("Add new task!");
    }
    else {
        createTask();
        input.value = '';
    }
    input.focus();
}

function removeTask(event){
    if (!event.target.closest('.task-block__del-button')) return;

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
    block.querySelector(".fa-trash").style.color = color;
    block.querySelector(".fa-arrows-up-down").style.color = color;
}

function moveTask(event) {
    if (!event.target.closest('.task-block__mover')) return;
    if (document.querySelectorAll(".task-block").length < 2) return;

    let movedBlock = event.target.closest(".task-block");
    let taskList = document.querySelector('.task-list');
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
    if (taskField.getAttribute("contentEditable")) return;
    
    let valueBefore = taskField.textContent;
    let okButton = document.createElement('button');
    
    okButton.innerHTML = `<i class="fa-solid fa-check fa-2xl" style="color: #00dd38;"></i>`;
    okButton.classList.add("task-block_button-style");
    
    taskField.contentEditable = true;
    taskField.after(okButton);
    taskField.focus();
    document.getSelection().setBaseAndExtent(taskField, 0, taskField, taskField.childNodes.length);
    taskField.parentElement.style.border = "2px solid #3a88fe";
    
    document.addEventListener('click', cancelEditing);
    document.addEventListener('keydown', cancelEditing);
    document.addEventListener('keydown', applyEditing);
    okButton.addEventListener('click', applyEditing);
    
    function cancelEditing(event){
        if (!event.code && 
            event.target.closest(".task-block__task-container") === taskField.parentElement) return;
        if (event.code && event.code !== "Escape") return;
        
        finishEditing(true)
    }
    
    function applyEditing(event){
        if (event.code && event.code !== "Enter") return;
        finishEditing();
    }
    
    function finishEditing(cancel = false){
        if (cancel) taskField.textContent = valueBefore;
        taskField.removeAttribute('contentEditable');
        okButton.remove();
        taskField.parentElement.style.removeProperty('border');

        document.removeEventListener('click', cancelEditing);
        document.removeEventListener('keydown', cancelEditing);
        document.removeEventListener('keydown', applyEditing);
        okButton.removeEventListener('click', applyEditing);
    }
    
}
