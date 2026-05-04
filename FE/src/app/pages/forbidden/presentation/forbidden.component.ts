import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Image} from 'primeng/image';
import {Tag} from 'primeng/tag';

/**
 * Component for the forbidden page.
 */
@Component({
  standalone: true,
  selector: 'app-forbidden',
  imports: [
    Button,
    Card,
    Image,
    RouterLink,
    Tag,
    PrimeTemplate,
    TranslocoPipe
  ],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.scss',
})
export class ForbiddenComponent {}
