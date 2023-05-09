import 'reflect-metadata';
import {CsvRouter, DocxRouter, EmailRouter, MboxRouter, XmlRouter, ZipRouter} from '../services';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';

const routers = [
    () => {
        const router = container.resolve(CsvRouter);
        router.run(new TopicGroup('edrm-files-csv', 'edrm-files'));
    },
    () => {
        const router = container.resolve(DocxRouter);
        router.run(new TopicGroup('edrm-files-docx', 'edrm-files'));
    },
    () => {
        const router = container.resolve(EmailRouter);
        router.run(new TopicGroup('edrm-files-email', 'edrm-files'));
    },
    () => {
        const router = container.resolve(MboxRouter);
        router.run(new TopicGroup('edrm-files-mbox', 'edrm-files'));
    },
    () => {
        const router = container.resolve(XmlRouter);
        router.run(new TopicGroup('edrm-files-xml', 'edrm-files'));
    },
    () => {
        const router = container.resolve(ZipRouter);
        router.run(new TopicGroup('edrm-files-zip', 'edrm-files'));
    }
];

routers.forEach(router => router());


