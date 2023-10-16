let input = document.querySelector(".add-task__input");

document.querySelector(".add-task__button").addEventListener('click', addTask);
document.addEventListener('keydown', function (event) {
    if (document.activeElement === input && event.code === 'Enter') addTask();
});
document.addEventListener("click", removeTask);
document.addEventListener('click', noticeTaskDone);
document.addEventListener('pointerdown', moveTask);

function createTask() {
    document.querySelector(".task-list")
        .insertAdjacentHTML(
            "beforeend"
            , `<div class="task-block">
                <div class="task-block__mover">
                    <i class="fa-solid fa-arrows-up-down fa-lg" style="color: #ebebeb;"></i>
                  </div>
                <div class="task-block__task">
                    ${input.value}
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
    let but = event.target.closest(".task-block__check-button");
    if (!but) return;
    
    let block = event.target.closest(".task-block");
    
    block.classList.toggle('task-done');
    [but.children[0].hidden, but.children[1].hidden] = [but.children[1].hidden, but.children[0].hidden]
    
    let color = but.children[0].hidden ? '#ffffff' : "#ebebeb";
    
    but.style.borderColor = color;
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
        if (left < 0) left = 0;
        if (left > document.documentElement.clientWidth - movedBlock.offsetWidth) {
            left = document.documentElement.clientWidth - movedBlock.offsetWidth;
        }
        
        if (top < 0) top = 0;
        if (top > document.documentElement.clientHeight - movedBlock.offsetHeight) {
            top = document.documentElement.clientHeight - movedBlock.offsetHeight;
        }
        
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
    }
}