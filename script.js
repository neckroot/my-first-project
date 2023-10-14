let input = document.querySelector(".add-task__input");
//переписать взаимодействие с формой
document.querySelector(".add-task__button").addEventListener('click', addTask);
document.addEventListener('keydown', function (event) {
    if (document.activeElement === input && event.code === 'Enter') {
        addTask();
    } else return;
});
document.addEventListener("click", removeTask);
document.addEventListener('click', noticeTaskDone);
document.addEventListener('pointerdown', moveTask);

function createTask() {
    document.querySelector(".task-list")
        .insertAdjacentHTML(
            "beforeend"
            , `<div class="task-block">
                <div class="task-block__mover">move</div>
                <div class="task-block__task">
                    ${input.value}
                </div>
                <button class="task-block__button" type="button">Del</button>
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
        input.focus();
    }
}

function removeTask(event){
    if (!event.target.classList.contains('task-block__button')) return;

    event.target.closest('.task-block').remove();
}

function noticeTaskDone(event) {
    if (!event.target.classList.contains("task-block__task")) return;

    event.target.classList.toggle('task-done');
}

function moveTask(event) {
    if (!event.target.classList.contains('task-block__mover')) return;
    if (document.querySelectorAll(".task-block").length < 2) return;
    
    let movedBlock = event.target.closest(".task-block");
    let pointerSeparator = document.createElement('div');
    let taskList = document.querySelector('.task-list');
    pointerSeparator.classList.add('task-list__pointer-separator');
    
    takeTask();
    
    let shiftX = event.clientX - movedBlock.getBoundingClientRect().left;
    let shiftY = event.clientY - movedBlock.getBoundingClientRect().top;

    document.addEventListener('pointermove', shiftTask);
    document.addEventListener('pointerup', putTask);
    document.addEventListener('pointercancel', putTask)
    
    function takeTask() {
        movedBlock.before(pointerSeparator);
        movedBlock.classList.add("task-block_move-state");
    }

    function shiftTask(event) {
        event.preventDefault();
        
        movedBlock.style.top = event.clientY - shiftY + 'px';
        movedBlock.style.left = event.clientX - shiftX + 'px';
        
        if (getCord(pointerSeparator, 'top') - getCord(movedBlock, 'top') >= getCord(movedBlock, 'height') / 2 ){
            if (pointerSeparator !== taskList.firstElementChild) {
                taskList.insertBefore(pointerSeparator, pointerSeparator.previousElementSibling);
            }
        }
        
        if (getCord(movedBlock, 'top') - getCord(pointerSeparator, 'top') >= getCord(movedBlock, 'height') / 2 ){
            if (pointerSeparator !== taskList.lastElementChild) {
                taskList.insertBefore(pointerSeparator, pointerSeparator.nextElementSibling.nextElementSibling);
            }
        }
        
        function getCord(elem, cord){
            return elem.getBoundingClientRect()[cord];
        }
    }

    function putTask() {
        if(!document.querySelector(".task-block_move-state")) return;
        
        document.removeEventListener("pointermove", shiftTask);
        document.removeEventListener("pointerup", putTask);
        document.removeEventListener("pointercancel", putTask);
        
        movedBlock.classList.remove("task-block_move-state");
        pointerSeparator.replaceWith(movedBlock);
        movedBlock.style.removeProperty("top");
        movedBlock.style.removeProperty("left");
    }
}