import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Image} from 'primeng/image';
import {Tag} from 'primeng/tag';

/**
 * Component for the not found page.
 */
@Component({
  standalone: true,
  selector: 'app-notfound',
  imports: [
    Button,
    Card,
    Image,
    RouterLink,
    Tag,
    PrimeTemplate,
    TranslocoPipe
  ],
  templateUrl: './notfound.component.html',
  styleUrl: './notfound.component.scss'
})
export class NotFoundComponent {}
