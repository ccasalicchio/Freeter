import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Basic/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['S', 'M', 'L', 'Fill'] },
    caption: { control: 'text' },
    primary: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Small: Story = {
  args: {
    size: 'S',
    caption: 'Small',
    onClick: () => alert('Clicked!'),
  },
};

export const Medium: Story = {
  args: {
    size: 'M',
    caption: 'Medium',
    onClick: () => alert('Clicked!'),
  },
};

export const Primary: Story = {
  args: {
    size: 'M',
    caption: 'Primary',
    primary: true,
    onClick: () => alert('Clicked!'),
  },
};

export const Fill: Story = {
  args: {
    size: 'Fill',
    caption: 'Fill',
    onClick: () => alert('Clicked!'),
  },
};
