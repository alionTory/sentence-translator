interface Observer{
    /**
     * @require subject는 Object 인스턴스에 대해 update를 호출한 객체 자신이여야 함.
     */
    update(subject: Object): void;
}

export { Observer }