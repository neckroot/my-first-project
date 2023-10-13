let input = document.querySelector(".add-task__input");
//Добавление таски
document.querySelector(".add-task__button").addEventListener('click', addTask);
document.addEventListener("click", removeTask);
document.addEventListener('click', noticeTaskDone);
document.addEventListener('pointerdown', takeTask);
document.addEventListener('pointermove', shiftTask);
document.addEventListener('pointerup', putTask);

function createTask() {
    document.querySelector(".task-list")
        .insertAdjacentHTML(
            "beforeend"
            , `<div class="task-block">
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

function takeTask(event) {

}

function shiftTask(event) {

}

function putTask(event){

}